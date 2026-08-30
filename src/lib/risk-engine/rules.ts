import type {
  ServiceConnection,
  ServiceNode,
  ServiceType,
} from "@/types/architecture";
import type { FindingSeverity } from "@/types/security";

export type ArchitectureRuleContext = {
  services: readonly ServiceNode[];
  connections: readonly ServiceConnection[];
  servicesById: ReadonlyMap<string, ServiceNode>;
};

export type SecurityRuleMatch =
  | { serviceId: string; connectionId?: never }
  | { connectionId: string; serviceId?: string };

export type SecurityRule = {
  id: string;
  title: string;
  severity: FindingSeverity;
  description: string;
  recommendation: string;
  evaluate: (context: ArchitectureRuleContext) => SecurityRuleMatch[];
};

const authorizationRelevantServiceTypes = new Set<ServiceType>([
  "api",
  "backend",
  "gateway",
]);

const rateLimitedApiServiceTypes = new Set<ServiceType>(["api", "gateway"]);

function matchServices(
  context: ArchitectureRuleContext,
  predicate: (service: ServiceNode) => boolean,
): SecurityRuleMatch[] {
  return context.services
    .filter(predicate)
    .map((service) => ({ serviceId: service.id }));
}

export const securityRules: readonly SecurityRule[] = [
  {
    id: "AM-001",
    title: "Public database exposure",
    severity: "critical",
    description:
      "The database is directly exposed to the public network, increasing the risk of unauthorized access to stored data.",
    recommendation:
      "Restrict database access to private or internal networks and allow only required application services to connect.",
    evaluate: (context) =>
      matchServices(
        context,
        (service) =>
          service.type === "database" && service.exposure === "public",
      ),
  },
  {
    id: "AM-002",
    title: "Public API without authentication",
    severity: "critical",
    description:
      "The public REST API does not require authentication, allowing unauthenticated clients to reach its operations.",
    recommendation:
      "Require an appropriate authentication method for every non-public API operation.",
    evaluate: (context) =>
      matchServices(
        context,
        (service) =>
          service.type === "api" &&
          service.exposure === "public" &&
          service.authentication === "none",
      ),
  },
  {
    id: "AM-003",
    title: "Missing authorization",
    severity: "high",
    description:
      "The service authenticates clients but does not define an authorization control for protected operations.",
    recommendation:
      "Apply RBAC, ABAC, ACL, or policy-based authorization and enforce it at resource level.",
    evaluate: (context) =>
      matchServices(
        context,
        (service) =>
          authorizationRelevantServiceTypes.has(service.type) &&
          service.authentication !== "none" &&
          service.authorization === "none",
      ),
  },
  {
    id: "AM-004",
    title: "Sensitive service without encryption in transit",
    severity: "high",
    description:
      "The service handles sensitive data without requiring encryption in transit, exposing data to interception or modification.",
    recommendation:
      "Require TLS for all inbound and outbound traffic involving this service.",
    evaluate: (context) =>
      matchServices(
        context,
        (service) =>
          service.sensitiveData && !service.encryptionInTransit,
      ),
  },
  {
    id: "AM-005",
    title: "Sensitive database without encryption at rest",
    severity: "high",
    description:
      "The database stores sensitive data while encryption at rest is explicitly disabled.",
    recommendation:
      "Enable database or storage-layer encryption at rest and protect the associated encryption keys.",
    evaluate: (context) =>
      matchServices(
        context,
        (service) =>
          service.type === "database" &&
          service.sensitiveData &&
          service.encryptionAtRest === false,
      ),
  },
  {
    id: "AM-006",
    title: "Public API without rate limiting",
    severity: "medium",
    description:
      "The public API entry point has no rate limiting, increasing exposure to abuse and resource exhaustion.",
    recommendation:
      "Apply request limits appropriate to client identity, endpoint cost, and expected traffic.",
    evaluate: (context) =>
      matchServices(
        context,
        (service) =>
          rateLimitedApiServiceTypes.has(service.type) &&
          service.exposure === "public" &&
          !service.rateLimiting,
      ),
  },
  {
    id: "AM-007",
    title: "Unencrypted HTTP connection",
    severity: "medium",
    description:
      "The connection uses HTTP without encryption, allowing traffic to be observed or modified in transit.",
    recommendation:
      "Use HTTPS and require TLS validation between the connected services.",
    evaluate: (context) =>
      context.connections
        .filter(
          (connection) =>
            connection.protocol === "http" && !connection.encrypted,
        )
        .map((connection) => ({ connectionId: connection.id })),
  },
  {
    id: "AM-008",
    title: "Sensitive data over an unencrypted connection",
    severity: "high",
    description:
      "The unencrypted connection involves a service marked as handling sensitive data.",
    recommendation:
      "Encrypt the connection and require transport security at both endpoints.",
    evaluate: (context) =>
      context.connections.flatMap((connection) => {
        if (connection.encrypted) {
          return [];
        }

        const source = context.servicesById.get(connection.source);
        const target = context.servicesById.get(connection.target);
        const sensitiveService = source?.sensitiveData
          ? source
          : target?.sensitiveData
            ? target
            : null;

        return sensitiveService
          ? [
              {
                connectionId: connection.id,
                serviceId: sensitiveService.id,
              },
            ]
          : [];
      }),
  },
  {
    id: "AM-009",
    title: "Public sensitive object storage",
    severity: "critical",
    description:
      "The object storage service is publicly exposed and handles sensitive data.",
    recommendation:
      "Remove public access and restrict storage access to explicitly authorized services and identities.",
    evaluate: (context) =>
      matchServices(
        context,
        (service) =>
          service.type === "storage" &&
          service.exposure === "public" &&
          service.sensitiveData,
      ),
  },
  {
    id: "AM-010",
    title: "Public authentication service without rate limiting",
    severity: "high",
    description:
      "The public authentication service has no rate limiting, increasing exposure to credential attacks and resource abuse.",
    recommendation:
      "Apply rate limits to authentication attempts using account, client, and network signals.",
    evaluate: (context) =>
      matchServices(
        context,
        (service) =>
          service.type === "auth" &&
          service.exposure === "public" &&
          !service.rateLimiting,
      ),
  },
];
