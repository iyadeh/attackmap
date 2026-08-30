import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  AuthenticationMethod,
  AuthorizationModel,
  ConnectionProtocol,
  DataClassification,
  ServiceExposure,
  ServiceProtocol,
  ServiceType,
} from "@/types/architecture";

const serviceTypeValues = [
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
] as const satisfies readonly [ServiceType, ...ServiceType[]];

const serviceExposureValues = [
  "public",
  "private",
  "internal",
] as const satisfies readonly [ServiceExposure, ...ServiceExposure[]];

const authenticationMethodValues = [
  "none",
  "session",
  "jwt",
  "oauth2",
  "oidc",
  "api_key",
  "mtls",
] as const satisfies readonly [AuthenticationMethod, ...AuthenticationMethod[]];

const authorizationModelValues = [
  "none",
  "rbac",
  "abac",
  "acl",
  "policy",
] as const satisfies readonly [AuthorizationModel, ...AuthorizationModel[]];

const dataClassificationValues = [
  "public",
  "internal",
  "confidential",
  "restricted",
] as const satisfies readonly [DataClassification, ...DataClassification[]];

const serviceProtocolValues = ["https", "tcp_tls"] as const satisfies readonly [
  ServiceProtocol,
  ...ServiceProtocol[],
];

const connectionProtocolValues = [
  "https",
  "http",
  "grpc",
  "tcp",
  "websocket",
] as const satisfies readonly [ConnectionProtocol, ...ConnectionProtocol[]];

export const serviceTypeEnum = pgEnum("service_type", serviceTypeValues);
export const serviceExposureEnum = pgEnum(
  "service_exposure",
  serviceExposureValues,
);
export const authenticationMethodEnum = pgEnum(
  "authentication_method",
  authenticationMethodValues,
);
export const authorizationModelEnum = pgEnum(
  "authorization_model",
  authorizationModelValues,
);
export const dataClassificationEnum = pgEnum(
  "data_classification",
  dataClassificationValues,
);
export const serviceProtocolEnum = pgEnum(
  "service_protocol",
  serviceProtocolValues,
);
export const connectionProtocolEnum = pgEnum(
  "connection_protocol",
  connectionProtocolValues,
);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const services = pgTable(
  "services",
  {
    id: text("id").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: serviceTypeEnum("type").notNull(),
    technology: text("technology").notNull(),
    exposure: serviceExposureEnum("exposure").notNull(),
    protocol: serviceProtocolEnum("protocol").notNull(),
    authentication: authenticationMethodEnum("authentication").notNull(),
    authorization: authorizationModelEnum("authorization").notNull(),
    encryptionInTransit: boolean("encryption_in_transit").notNull(),
    encryptionAtRest: boolean("encryption_at_rest"),
    rateLimiting: boolean("rate_limiting").notNull(),
    sensitiveData: boolean("sensitive_data").notNull(),
    dataClassification: dataClassificationEnum("data_classification").notNull(),
    positionX: doublePrecision("position_x").notNull(),
    positionY: doublePrecision("position_y").notNull(),
  },
  (table) => [
    primaryKey({
      name: "services_project_id_id_pk",
      columns: [table.projectId, table.id],
    }),
  ],
);

export const serviceConnections = pgTable(
  "service_connections",
  {
    id: text("id").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sourceServiceId: text("source_service_id").notNull(),
    targetServiceId: text("target_service_id").notNull(),
    protocol: connectionProtocolEnum("protocol").notNull(),
    encrypted: boolean("encrypted").notNull(),
  },
  (table) => [
    primaryKey({
      name: "service_connections_project_id_id_pk",
      columns: [table.projectId, table.id],
    }),
    foreignKey({
      name: "service_connections_source_service_fk",
      columns: [table.projectId, table.sourceServiceId],
      foreignColumns: [services.projectId, services.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "service_connections_target_service_fk",
      columns: [table.projectId, table.targetServiceId],
      foreignColumns: [services.projectId, services.id],
    }).onDelete("cascade"),
    unique("service_connections_project_source_target_unique").on(
      table.projectId,
      table.sourceServiceId,
      table.targetServiceId,
    ),
    check(
      "service_connections_no_self_connection",
      sql`${table.sourceServiceId} <> ${table.targetServiceId}`,
    ),
    index("service_connections_target_service_idx").on(
      table.projectId,
      table.targetServiceId,
    ),
  ],
);

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type ServiceRow = typeof services.$inferSelect;
export type NewServiceRow = typeof services.$inferInsert;
export type ServiceConnectionRow = typeof serviceConnections.$inferSelect;
export type NewServiceConnectionRow = typeof serviceConnections.$inferInsert;
