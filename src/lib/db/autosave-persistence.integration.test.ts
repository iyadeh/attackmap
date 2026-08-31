import assert from "node:assert/strict";
import test from "node:test";

import { loadEnvConfig } from "@next/env";
import { asc, eq } from "drizzle-orm";

import {
  createArchitectureAutosaveCoordinator,
  type ArchitectureAutosaveCoordinator,
} from "../architecture/autosave-coordinator";
import type { ArchitectureSnapshot, ServiceNode } from "../../types/architecture";

import { projects, serviceConnections, services } from "./schema";

loadEnvConfig(process.cwd());

const integrationProject = {
  id: "00000000-0000-4000-8000-000000000096",
  name: "Autosave persistence regression test",
  description: "Isolated project removed after the test.",
};

function createSnapshot(
  marker: string,
  positionX: number,
  encrypted: boolean,
): ArchitectureSnapshot {
  const api: ServiceNode = {
    id: "api",
    name: `${marker} API`,
    type: "api",
    technology: marker,
    exposure: "public",
    protocol: "https",
    authentication: "jwt",
    authorization: "rbac",
    encryptionInTransit: true,
    rateLimiting: true,
    sensitiveData: true,
    dataClassification: "confidential",
  };
  const database: ServiceNode = {
    id: "database",
    name: `${marker} database`,
    type: "database",
    technology: "PostgreSQL 17",
    exposure: "private",
    protocol: "tcp_tls",
    authentication: "mtls",
    authorization: "acl",
    encryptionInTransit: true,
    encryptionAtRest: encrypted,
    rateLimiting: false,
    sensitiveData: true,
    dataClassification: "restricted",
  };

  return {
    services: [api, database],
    servicePositions: [
      { serviceId: api.id, x: positionX, y: 80 },
      { serviceId: database.id, x: positionX + 320, y: 240 },
    ],
    connections: [
      {
        id: "api-to-database",
        source: api.id,
        target: database.id,
        protocol: encrypted ? "tcp" : "http",
        encrypted,
      },
    ],
  };
}

function createTestScheduler() {
  let callback: (() => void) | null = null;

  return {
    scheduler: {
      set(nextCallback: () => void) {
        callback = nextCallback;
        return 1;
      },
      clear() {
        callback = null;
      },
    },
    flush() {
      const scheduledCallback = callback;
      callback = null;
      scheduledCallback?.();
    },
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

test("explicit save and autosave commit the newest snapshot to PostgreSQL", async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for persistence integration tests.");
  }

  const { closeDatabase, getDatabase } = await import("./client");
  const { loadArchitectureProject, saveArchitectureProject } = await import(
    "./architecture-persistence"
  );
  const database = getDatabase();
  const snapshotA = createSnapshot("PERSISTED-A", 40, false);
  const snapshotB = createSnapshot("LATEST-EXPLICIT-B", 365.5, true);
  const snapshotC = createSnapshot("LATEST-AUTOSAVE-C", -120.25, false);
  const snapshotD = createSnapshot("LATEST-QUEUED-D", 712.75, true);
  const coordinators: ArchitectureAutosaveCoordinator[] = [];

  try {
    await database
      .delete(projects)
      .where(eq(projects.id, integrationProject.id));
    await database.insert(projects).values(integrationProject);
    await saveArchitectureProject(integrationProject.id, snapshotA);

    const explicitCoordinator = createArchitectureAutosaveCoordinator({
      initialSnapshot: snapshotA,
      delay: 1_500,
      save: async (snapshot) => {
        await saveArchitectureProject(integrationProject.id, snapshot);
        return true;
      },
      onStatusChange: () => undefined,
    });
    coordinators.push(explicitCoordinator);

    explicitCoordinator.observe(snapshotB);
    assert.equal(await explicitCoordinator.saveNow(snapshotB), true);

    const rowsAfterExplicitSave = await database
      .select({
        id: services.id,
        name: services.name,
        technology: services.technology,
        positionX: services.positionX,
      })
      .from(services)
      .where(eq(services.projectId, integrationProject.id))
      .orderBy(asc(services.id));
    const connectionsAfterExplicitSave = await database
      .select({
        protocol: serviceConnections.protocol,
        encrypted: serviceConnections.encrypted,
      })
      .from(serviceConnections)
      .where(eq(serviceConnections.projectId, integrationProject.id));

    assert.deepEqual(rowsAfterExplicitSave, [
      {
        id: "api",
        name: "LATEST-EXPLICIT-B API",
        technology: "LATEST-EXPLICIT-B",
        positionX: 365.5,
      },
      {
        id: "database",
        name: "LATEST-EXPLICIT-B database",
        technology: "PostgreSQL 17",
        positionX: 685.5,
      },
    ]);
    assert.deepEqual(connectionsAfterExplicitSave, [
      { protocol: "tcp", encrypted: true },
    ]);
    const loadedAfterExplicitSave = await loadArchitectureProject(
      integrationProject.id,
    );
    assert.deepEqual(loadedAfterExplicitSave?.services, snapshotB.services);
    assert.deepEqual(
      loadedAfterExplicitSave?.servicePositions,
      snapshotB.servicePositions,
    );
    assert.deepEqual(
      loadedAfterExplicitSave?.connections,
      snapshotB.connections,
    );

    const testScheduler = createTestScheduler();
    const autosaveTasks: Promise<boolean>[] = [];
    const autosaveCoordinator = createArchitectureAutosaveCoordinator({
      initialSnapshot: snapshotB,
      delay: 1_500,
      scheduler: testScheduler.scheduler,
      save: (snapshot) => {
        const task = saveArchitectureProject(integrationProject.id, snapshot).then(
          () => true,
        );
        autosaveTasks.push(task);
        return task;
      },
      onStatusChange: () => undefined,
    });
    coordinators.push(autosaveCoordinator);

    autosaveCoordinator.observe(snapshotC);
    testScheduler.flush();
    const autosaveTask = autosaveTasks[0];
    assert.ok(autosaveTask);
    assert.equal(await autosaveTask, true);
    await flushPromises();

    const rowsAfterAutosave = await database
      .select({ name: services.name, positionX: services.positionX })
      .from(services)
      .where(eq(services.projectId, integrationProject.id))
      .orderBy(asc(services.id));
    assert.deepEqual(rowsAfterAutosave, [
      { name: "LATEST-AUTOSAVE-C API", positionX: -120.25 },
      { name: "LATEST-AUTOSAVE-C database", positionX: 199.75 },
    ]);
    const loadedAfterAutosave = await loadArchitectureProject(
      integrationProject.id,
    );
    assert.deepEqual(loadedAfterAutosave?.services, snapshotC.services);
    assert.deepEqual(
      loadedAfterAutosave?.servicePositions,
      snapshotC.servicePositions,
    );
    assert.deepEqual(loadedAfterAutosave?.connections, snapshotC.connections);

    const pendingWrites: Array<() => Promise<void>> = [];
    const orderedCoordinator = createArchitectureAutosaveCoordinator({
      initialSnapshot: snapshotC,
      delay: 1_500,
      save: (snapshot) =>
        new Promise((resolve) => {
          pendingWrites.push(async () => {
            await saveArchitectureProject(integrationProject.id, snapshot);
            resolve(true);
          });
        }),
      onStatusChange: () => undefined,
    });
    coordinators.push(orderedCoordinator);

    const olderSave = orderedCoordinator.saveNow(snapshotC);
    orderedCoordinator.observe(snapshotD);
    const newerSave = orderedCoordinator.saveNow(snapshotD);

    await pendingWrites[0]?.();
    assert.equal(await olderSave, true);
    await flushPromises();
    assert.equal(orderedCoordinator.isDirty(), true);
    assert.equal(orderedCoordinator.getStatus(), "saving");

    await pendingWrites[1]?.();
    assert.equal(await newerSave, true);
    await flushPromises();

    const finalRows = await database
      .select({
        name: services.name,
        technology: services.technology,
        positionX: services.positionX,
      })
      .from(services)
      .where(eq(services.projectId, integrationProject.id))
      .orderBy(asc(services.id));
    const finalConnections = await database
      .select({
        protocol: serviceConnections.protocol,
        encrypted: serviceConnections.encrypted,
      })
      .from(serviceConnections)
      .where(eq(serviceConnections.projectId, integrationProject.id));

    assert.deepEqual(finalRows, [
      {
        name: "LATEST-QUEUED-D API",
        technology: "LATEST-QUEUED-D",
        positionX: 712.75,
      },
      {
        name: "LATEST-QUEUED-D database",
        technology: "PostgreSQL 17",
        positionX: 1032.75,
      },
    ]);
    assert.deepEqual(finalConnections, [
      { protocol: "tcp", encrypted: true },
    ]);
    assert.deepEqual(
      (await loadArchitectureProject(integrationProject.id))?.services,
      snapshotD.services,
    );
    assert.equal(orderedCoordinator.isDirty(), false);
  } finally {
    coordinators.forEach((coordinator) => coordinator.dispose());
    await getDatabase()
      .delete(projects)
      .where(eq(projects.id, integrationProject.id));
    await closeDatabase();
  }
});
