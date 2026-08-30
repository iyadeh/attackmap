import type { ServiceNode, ServiceType } from "@/types/architecture";

export const creatableServiceTypes = [
  "internet",
  "web",
  "gateway",
  "api",
  "auth",
  "database",
  "storage",
] as const satisfies readonly ServiceType[];

export type CreatableServiceType = (typeof creatableServiceTypes)[number];

type ServiceDefaults = Omit<ServiceNode, "id" | "type">;

const serviceDefaults: Record<CreatableServiceType, ServiceDefaults> = {
  internet: {
    name: "Internet",
    technology: "Public network",
    exposure: "public",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    rateLimiting: false,
    sensitiveData: false,
    dataClassification: "public",
  },
  web: {
    name: "Web Application",
    technology: "Not specified",
    exposure: "public",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    rateLimiting: false,
    sensitiveData: false,
    dataClassification: "public",
  },
  gateway: {
    name: "API Gateway",
    technology: "Not specified",
    exposure: "public",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    rateLimiting: false,
    sensitiveData: false,
    dataClassification: "internal",
  },
  api: {
    name: "REST API",
    technology: "Not specified",
    exposure: "internal",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    rateLimiting: false,
    sensitiveData: false,
    dataClassification: "internal",
  },
  auth: {
    name: "Auth Service",
    technology: "Not specified",
    exposure: "public",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    rateLimiting: false,
    sensitiveData: true,
    dataClassification: "restricted",
  },
  database: {
    name: "Database",
    technology: "Not specified",
    exposure: "private",
    protocol: "tcp_tls",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    encryptionAtRest: false,
    rateLimiting: false,
    sensitiveData: false,
    dataClassification: "internal",
  },
  storage: {
    name: "Object Storage",
    technology: "Not specified",
    exposure: "private",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    encryptionAtRest: false,
    rateLimiting: false,
    sensitiveData: false,
    dataClassification: "internal",
  },
};

export function createService(
  type: CreatableServiceType,
  sequence: number,
): ServiceNode {
  return {
    id: `service-${sequence}`,
    type,
    ...serviceDefaults[type],
  };
}
