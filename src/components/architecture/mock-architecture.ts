import type { ServiceConnection, ServiceNode } from "@/types/architecture";
import type { ArchitectureNode } from "./service-node";

export const initialServices: ServiceNode[] = [
  {
    id: "web-application",
    name: "Web Application",
    type: "web",
    technology: "Next.js",
    exposure: "public",
    protocol: "https",
    authentication: "session",
    authorization: "policy",
    encryptionInTransit: true,
    rateLimiting: true,
    sensitiveData: false,
    dataClassification: "public",
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    type: "gateway",
    technology: "Kong",
    exposure: "public",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    rateLimiting: false,
    sensitiveData: false,
    dataClassification: "internal",
  },
  {
    id: "rest-api",
    name: "REST API",
    type: "api",
    technology: "Go",
    exposure: "internal",
    protocol: "https",
    authentication: "jwt",
    authorization: "rbac",
    encryptionInTransit: true,
    rateLimiting: true,
    sensitiveData: true,
    dataClassification: "confidential",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    type: "database",
    technology: "PostgreSQL 16",
    exposure: "private",
    protocol: "tcp_tls",
    authentication: "mtls",
    authorization: "acl",
    encryptionInTransit: true,
    encryptionAtRest: false,
    rateLimiting: false,
    sensitiveData: true,
    dataClassification: "restricted",
  },
];

export const initialNodes: ArchitectureNode[] = [
  {
    id: "web-application",
    type: "service",
    position: { x: 0, y: 150 },
    data: { serviceId: "web-application" },
  },
  {
    id: "api-gateway",
    type: "service",
    position: { x: 290, y: 150 },
    selected: true,
    data: { serviceId: "api-gateway" },
  },
  {
    id: "rest-api",
    type: "service",
    position: { x: 580, y: 150 },
    data: { serviceId: "rest-api" },
  },
  {
    id: "postgresql",
    type: "service",
    position: { x: 870, y: 150 },
    data: { serviceId: "postgresql" },
  },
];

export const initialConnections: ServiceConnection[] = [
  {
    id: "web-to-gateway",
    source: "web-application",
    target: "api-gateway",
    protocol: "https",
    encrypted: true,
  },
  {
    id: "gateway-to-api",
    source: "api-gateway",
    target: "rest-api",
    protocol: "https",
    encrypted: true,
  },
  {
    id: "api-to-database",
    source: "rest-api",
    target: "postgresql",
    protocol: "tcp",
    encrypted: true,
  },
];
