import assert from "node:assert/strict";
import test from "node:test";

import type {
  ArchitectureSnapshot,
  ServiceConnection,
  ServiceNode,
  ServicePosition,
} from "../../types/architecture";

import {
  mapArchitectureFromRows,
  mapConnectionFromRow,
  mapConnectionToRow,
  mapServiceFromRow,
  mapServiceToRow,
  parseArchitectureSnapshot,
} from "./architecture-mapper";
import type {
  ProjectRow,
  ServiceConnectionRow,
  ServiceRow,
} from "./schema";

const projectId = "00000000-0000-4000-8000-000000000099";

const databaseService: ServiceNode = {
  id: "database-1",
  name: "Primary database",
  type: "database",
  technology: "PostgreSQL 17",
  exposure: "private",
  protocol: "tcp_tls",
  authentication: "mtls",
  authorization: "acl",
  encryptionInTransit: true,
  encryptionAtRest: true,
  rateLimiting: false,
  sensitiveData: true,
  dataClassification: "restricted",
};

const databasePosition: ServicePosition = {
  serviceId: databaseService.id,
  x: 431.25,
  y: -82.5,
};

const apiService: ServiceNode = {
  id: "api-1",
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
};

const apiPosition: ServicePosition = {
  serviceId: apiService.id,
  x: 120,
  y: 40,
};

const connection: ServiceConnection = {
  id: "api-to-database",
  source: "api-1",
  target: databaseService.id,
  protocol: "tcp",
  encrypted: true,
};

test("service properties and position round-trip through persistence rows", () => {
  const row = mapServiceToRow(
    projectId,
    databaseService,
    databasePosition,
  ) as ServiceRow;

  assert.deepEqual(mapServiceFromRow(row), {
    service: databaseService,
    position: databasePosition,
  });
});

test("missing encryption at rest round-trips as an omitted domain property", () => {
  const row = mapServiceToRow(
    projectId,
    apiService,
    apiPosition,
  ) as ServiceRow;

  assert.equal(row.encryptionAtRest, null);
  assert.deepEqual(mapServiceFromRow(row), {
    service: apiService,
    position: apiPosition,
  });
});

test("connection properties round-trip through persistence rows", () => {
  const row = mapConnectionToRow(
    projectId,
    connection,
  ) as ServiceConnectionRow;

  assert.deepEqual(mapConnectionFromRow(row), connection);
});

test("architecture mapping returns source data only", () => {
  const serviceRow = mapServiceToRow(
    projectId,
    databaseService,
    databasePosition,
  ) as ServiceRow;
  const apiRow = mapServiceToRow(
    projectId,
    apiService,
    apiPosition,
  ) as ServiceRow;
  const connectionRow = mapConnectionToRow(
    projectId,
    connection,
  ) as ServiceConnectionRow;
  const projectRow: ProjectRow = {
    id: projectId,
    name: "Persistence test",
    description: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  const architecture = mapArchitectureFromRows(
    projectRow,
    [apiRow, serviceRow],
    [connectionRow],
  );

  assert.deepEqual(Object.keys(architecture).sort(), [
    "connections",
    "project",
    "servicePositions",
    "services",
  ]);
  assert.equal("findings" in architecture, false);
  assert.equal("securityScore" in architecture, false);
});

test("snapshot validation preserves valid domain values", () => {
  const snapshot: ArchitectureSnapshot = {
    services: [apiService, databaseService],
    servicePositions: [apiPosition, databasePosition],
    connections: [connection],
  };

  assert.deepEqual(parseArchitectureSnapshot(snapshot), snapshot);
  assert.throws(
    () =>
      parseArchitectureSnapshot({
        ...snapshot,
        servicePositions: [databasePosition],
      }),
    /invalid references/,
  );
});
