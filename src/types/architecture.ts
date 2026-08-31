export const serviceTypes = [
  "internet",
  "web",
  "mobile",
  "api",
  "gateway",
  "backend",
  "auth",
  "database",
  "cache",
  "storage",
  "queue",
  "third_party",
] as const;

export type ServiceType = (typeof serviceTypes)[number];

export const serviceExposures = ["public", "private", "internal"] as const;

export type ServiceExposure = (typeof serviceExposures)[number];

export const authenticationMethods = [
  "none",
  "session",
  "jwt",
  "oauth2",
  "oidc",
  "api_key",
  "mtls",
] as const;

export type AuthenticationMethod = (typeof authenticationMethods)[number];

export const authorizationModels = [
  "none",
  "rbac",
  "abac",
  "acl",
  "policy",
] as const;

export type AuthorizationModel = (typeof authorizationModels)[number];

export const dataClassifications = [
  "public",
  "internal",
  "confidential",
  "restricted",
] as const;

export type DataClassification = (typeof dataClassifications)[number];

export const serviceProtocols = ["https", "tcp_tls"] as const;

export type ServiceProtocol = (typeof serviceProtocols)[number];

export const connectionProtocols = [
  "https",
  "http",
  "grpc",
  "tcp",
  "websocket",
] as const;

export type ConnectionProtocol = (typeof connectionProtocols)[number];

export type ServiceNode = {
  id: string;
  name: string;
  type: ServiceType;
  technology: string;
  exposure: ServiceExposure;
  protocol: ServiceProtocol;
  authentication: AuthenticationMethod;
  authorization: AuthorizationModel;
  encryptionInTransit: boolean;
  encryptionAtRest?: boolean;
  rateLimiting: boolean;
  sensitiveData: boolean;
  dataClassification: DataClassification;
};

export type ServiceConnection = {
  id: string;
  source: string;
  target: string;
  protocol: ConnectionProtocol;
  encrypted: boolean;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ServicePosition = {
  serviceId: string;
  x: number;
  y: number;
};

export type ArchitectureSnapshot = {
  services: ServiceNode[];
  servicePositions: ServicePosition[];
  connections: ServiceConnection[];
};

export type ProjectArchitecture = ArchitectureSnapshot & {
  project: Project;
};
