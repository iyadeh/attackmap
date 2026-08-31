import assert from "node:assert/strict";
import test from "node:test";

import { getTableConfig } from "drizzle-orm/pg-core";

import {
  authenticationMethods,
  authorizationModels,
  connectionProtocols,
  dataClassifications,
  serviceExposures,
  serviceProtocols,
  serviceTypes,
  type ServiceConnection,
  type ServiceNode,
} from "../../types/architecture";

import {
  authenticationMethodEnum,
  authorizationModelEnum,
  connectionProtocolEnum,
  dataClassificationEnum,
  serviceConnections,
  serviceExposureEnum,
  serviceProtocolEnum,
  services,
  serviceTypeEnum,
  type NewServiceConnectionRow,
  type NewServiceRow,
} from "./schema";

test("database enums represent the architecture domain vocabulary", () => {
  assert.deepEqual(serviceTypeEnum.enumValues, serviceTypes);
  assert.deepEqual(serviceExposureEnum.enumValues, serviceExposures);
  assert.deepEqual(authenticationMethodEnum.enumValues, authenticationMethods);
  assert.deepEqual(authorizationModelEnum.enumValues, authorizationModels);
  assert.deepEqual(dataClassificationEnum.enumValues, dataClassifications);
  assert.deepEqual(serviceProtocolEnum.enumValues, serviceProtocols);
  assert.deepEqual(connectionProtocolEnum.enumValues, connectionProtocols);
});

test("current service and connection domain values fit insert rows", () => {
  const projectId = "018f6f78-796f-76d2-a825-87fef819d277";
  const service: ServiceNode = {
    id: "service-1",
    name: "Primary database",
    type: "database",
    technology: "PostgreSQL",
    exposure: "private",
    protocol: "tcp_tls",
    authentication: "mtls",
    authorization: "policy",
    encryptionInTransit: true,
    encryptionAtRest: true,
    rateLimiting: false,
    sensitiveData: true,
    dataClassification: "restricted",
  };
  const serviceRow = {
    ...service,
    projectId,
    positionX: 320,
    positionY: 180,
  } satisfies NewServiceRow;

  const connection: ServiceConnection = {
    id: "connection-1",
    source: "service-1",
    target: "service-2",
    protocol: "grpc",
    encrypted: true,
  };
  const connectionRow = {
    id: connection.id,
    projectId,
    sourceServiceId: connection.source,
    targetServiceId: connection.target,
    protocol: connection.protocol,
    encrypted: connection.encrypted,
  } satisfies NewServiceConnectionRow;

  assert.equal(serviceRow.encryptionAtRest, true);
  assert.equal(connectionRow.sourceServiceId, connection.source);
  assert.equal(connectionRow.targetServiceId, connection.target);
});

test("architecture records are project-scoped and cascade cleanup", () => {
  const serviceConfig = getTableConfig(services);
  const connectionConfig = getTableConfig(serviceConnections);

  assert.deepEqual(
    serviceConfig.primaryKeys[0]?.columns.map((column) => column.name),
    ["project_id", "id"],
  );
  assert.deepEqual(
    connectionConfig.primaryKeys[0]?.columns.map((column) => column.name),
    ["project_id", "id"],
  );
  assert.equal(serviceConfig.foreignKeys.length, 1);
  assert.equal(serviceConfig.foreignKeys[0]?.onDelete, "cascade");
  assert.equal(connectionConfig.foreignKeys.length, 3);
  assert.ok(
    connectionConfig.foreignKeys.every(
      (foreignKey) => foreignKey.onDelete === "cascade",
    ),
  );
});
