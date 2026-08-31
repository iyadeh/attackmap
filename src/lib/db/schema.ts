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

import {
  authenticationMethods,
  authorizationModels,
  connectionProtocols,
  dataClassifications,
  serviceExposures,
  serviceProtocols,
  serviceTypes,
} from "../../types/architecture";

export const serviceTypeEnum = pgEnum("service_type", serviceTypes);
export const serviceExposureEnum = pgEnum(
  "service_exposure",
  serviceExposures,
);
export const authenticationMethodEnum = pgEnum(
  "authentication_method",
  authenticationMethods,
);
export const authorizationModelEnum = pgEnum(
  "authorization_model",
  authorizationModels,
);
export const dataClassificationEnum = pgEnum(
  "data_classification",
  dataClassifications,
);
export const serviceProtocolEnum = pgEnum(
  "service_protocol",
  serviceProtocols,
);
export const connectionProtocolEnum = pgEnum(
  "connection_protocol",
  connectionProtocols,
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
