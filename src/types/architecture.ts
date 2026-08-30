export type ServiceType =
  | "internet"
  | "web"
  | "mobile"
  | "api"
  | "gateway"
  | "backend"
  | "auth"
  | "database"
  | "cache"
  | "storage"
  | "queue"
  | "third_party";

export type ServiceExposure = "public" | "private" | "internal";

export type AuthenticationMethod =
  | "none"
  | "session"
  | "jwt"
  | "oauth2"
  | "oidc"
  | "api_key"
  | "mtls";

export type AuthorizationModel = "none" | "rbac" | "abac" | "acl" | "policy";

export type DataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted";

export type ServiceProtocol = "https" | "tcp_tls";

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
  rateLimiting: boolean;
  sensitiveData: boolean;
  dataClassification: DataClassification;
};
