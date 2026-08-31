import assert from "node:assert/strict";
import test from "node:test";

import type { ArchitectureSnapshot } from "../../types/architecture";

import {
  createArchitectureAutosaveCoordinator,
  type ArchitectureSaveStatus,
} from "./autosave-coordinator";

function createSnapshot(name: string, x = 20): ArchitectureSnapshot {
  return {
    services: [
      {
        id: "api",
        name,
        type: "api",
        technology: "TypeScript",
        exposure: "internal",
        protocol: "https",
        authentication: "jwt",
        authorization: "rbac",
        encryptionInTransit: true,
        rateLimiting: true,
        sensitiveData: false,
        dataClassification: "internal",
      },
    ],
    servicePositions: [{ serviceId: "api", x, y: 40 }],
    connections: [],
  };
}

function createTestScheduler() {
  let nextHandle = 1;
  const callbacks = new Map<number, () => void>();

  return {
    scheduler: {
      set(callback: () => void) {
        const handle = nextHandle;
        nextHandle += 1;
        callbacks.set(handle, callback);
        return handle;
      },
      clear(handle: unknown) {
        callbacks.delete(handle as number);
      },
    },
    flush() {
      const pendingCallbacks = [...callbacks.values()];
      callbacks.clear();
      pendingCallbacks.forEach((callback) => callback());
    },
    size() {
      return callbacks.size;
    },
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

function createMemoryPersistence(initialSnapshot: ArchitectureSnapshot) {
  let persistedSnapshot = structuredClone(initialSnapshot);

  return {
    save: async (snapshot: ArchitectureSnapshot) => {
      persistedSnapshot = structuredClone(snapshot);
      return true;
    },
    load: () => structuredClone(persistedSnapshot),
  };
}

test("meaningful edits become dirty and debounce into one latest save", async () => {
  const initialSnapshot = createSnapshot("Initial");
  const firstEdit = createSnapshot("First edit");
  const latestEdit = createSnapshot("Latest edit", 280);
  const savedSnapshots: ArchitectureSnapshot[] = [];
  const statuses: ArchitectureSaveStatus[] = [];
  const testScheduler = createTestScheduler();
  const coordinator = createArchitectureAutosaveCoordinator({
    initialSnapshot,
    delay: 1_500,
    scheduler: testScheduler.scheduler,
    save: async (snapshot) => {
      savedSnapshots.push(snapshot);
      return true;
    },
    onStatusChange: (status) => statuses.push(status),
  });

  coordinator.observe(structuredClone(initialSnapshot));
  assert.equal(coordinator.isDirty(), false);
  assert.equal(testScheduler.size(), 0);

  coordinator.observe(firstEdit);
  coordinator.observe(latestEdit);

  assert.equal(coordinator.isDirty(), true);
  assert.equal(coordinator.getStatus(), "unsaved");
  assert.equal(testScheduler.size(), 1);
  assert.deepEqual(savedSnapshots, []);

  testScheduler.flush();
  await flushPromises();

  assert.deepEqual(savedSnapshots, [latestEdit]);
  assert.equal(coordinator.isDirty(), false);
  assert.equal(coordinator.getStatus(), "saved");
  assert.deepEqual(statuses, ["unsaved", "saving", "saved"]);
});

test("failed autosave preserves dirty state and can retry after another edit", async () => {
  const initialSnapshot = createSnapshot("Initial");
  const failedEdit = createSnapshot("Failed edit");
  const retryEdit = createSnapshot("Retry edit");
  const testScheduler = createTestScheduler();
  let saveAttempts = 0;
  const coordinator = createArchitectureAutosaveCoordinator({
    initialSnapshot,
    delay: 1_500,
    scheduler: testScheduler.scheduler,
    save: async () => {
      saveAttempts += 1;
      return saveAttempts > 1;
    },
    onStatusChange: () => undefined,
  });

  coordinator.observe(failedEdit);
  testScheduler.flush();
  await flushPromises();

  assert.equal(coordinator.getStatus(), "error");
  assert.equal(coordinator.isDirty(), true);
  assert.equal(failedEdit.services[0]?.name, "Failed edit");

  coordinator.observe(retryEdit);
  testScheduler.flush();
  await flushPromises();

  assert.equal(saveAttempts, 2);
  assert.equal(coordinator.getStatus(), "saved");
  assert.equal(coordinator.isDirty(), false);
});

test("explicit save bypasses debounce and explicit load reset cancels it", async () => {
  const initialSnapshot = createSnapshot("Initial");
  const edit = createSnapshot("Edited");
  const testScheduler = createTestScheduler();
  const savedSnapshots: ArchitectureSnapshot[] = [];
  const coordinator = createArchitectureAutosaveCoordinator({
    initialSnapshot,
    delay: 1_500,
    scheduler: testScheduler.scheduler,
    save: async (snapshot) => {
      savedSnapshots.push(snapshot);
      return true;
    },
    onStatusChange: () => undefined,
  });

  coordinator.observe(edit);
  assert.equal(testScheduler.size(), 1);
  assert.equal(await coordinator.saveNow(edit), true);
  assert.deepEqual(savedSnapshots, [edit]);
  assert.equal(testScheduler.size(), 0);

  const discardedEdit = createSnapshot("Discarded");
  coordinator.observe(discardedEdit);
  assert.equal(testScheduler.size(), 1);

  await coordinator.pause();
  coordinator.reset(edit);
  testScheduler.flush();
  await flushPromises();

  assert.deepEqual(savedSnapshots, [edit]);
  assert.equal(coordinator.isDirty(), false);
  assert.equal(coordinator.getStatus(), "saved");
});

test("disposing a project cancels its delayed autosave", async () => {
  const testScheduler = createTestScheduler();
  const projectAWrites: ArchitectureSnapshot[] = [];
  const projectBWrites: ArchitectureSnapshot[] = [];
  const projectA = createArchitectureAutosaveCoordinator({
    initialSnapshot: createSnapshot("Project A"),
    delay: 1_500,
    scheduler: testScheduler.scheduler,
    save: async (snapshot) => {
      projectAWrites.push(snapshot);
      return true;
    },
    onStatusChange: () => undefined,
  });

  projectA.observe(createSnapshot("Project A changed"));
  projectA.dispose();

  const projectB = createArchitectureAutosaveCoordinator({
    initialSnapshot: createSnapshot("Project B"),
    delay: 1_500,
    scheduler: testScheduler.scheduler,
    save: async (snapshot) => {
      projectBWrites.push(snapshot);
      return true;
    },
    onStatusChange: () => undefined,
  });

  testScheduler.flush();
  await flushPromises();

  assert.deepEqual(projectAWrites, []);
  assert.deepEqual(projectBWrites, []);
  assert.equal(projectB.getStatus(), "saved");
});

test("save requests are serialized so older completion cannot overwrite newer state", async () => {
  const firstEdit = createSnapshot("First edit");
  const latestEdit = createSnapshot("Latest edit");
  const testScheduler = createTestScheduler();
  const savedSnapshots: ArchitectureSnapshot[] = [];
  const resolvers: Array<(saved: boolean) => void> = [];
  const coordinator = createArchitectureAutosaveCoordinator({
    initialSnapshot: createSnapshot("Initial"),
    delay: 1_500,
    scheduler: testScheduler.scheduler,
    save: (snapshot) => {
      savedSnapshots.push(snapshot);
      return new Promise((resolve) => resolvers.push(resolve));
    },
    onStatusChange: () => undefined,
  });

  coordinator.observe(firstEdit);
  testScheduler.flush();
  assert.deepEqual(savedSnapshots, [firstEdit]);

  const latestSave = coordinator.saveNow(latestEdit);
  assert.deepEqual(savedSnapshots, [firstEdit]);

  resolvers[0]?.(true);
  await flushPromises();
  assert.deepEqual(savedSnapshots, [firstEdit, latestEdit]);
  assert.equal(coordinator.getStatus(), "saving");

  resolvers[1]?.(true);
  assert.equal(await latestSave, true);
  await flushPromises();

  assert.equal(coordinator.isDirty(), false);
  assert.equal(coordinator.getStatus(), "saved");
});

test("explicit save commits the latest editor snapshot before load", async () => {
  const snapshotA = createSnapshot("Persisted A");
  const snapshotB = createSnapshot("Explicit B", 360);
  const persistence = createMemoryPersistence(snapshotA);
  const coordinator = createArchitectureAutosaveCoordinator({
    initialSnapshot: snapshotA,
    delay: 1_500,
    save: persistence.save,
    onStatusChange: () => undefined,
  });

  coordinator.observe(snapshotB);
  assert.equal(await coordinator.saveNow(snapshotB), true);

  assert.deepEqual(persistence.load(), snapshotB);
  assert.equal(coordinator.isDirty(), false);
});

test("autosave commits the latest settled snapshot before load", async () => {
  const snapshotA = createSnapshot("Persisted A");
  const snapshotB = createSnapshot("Autosave B", 410);
  const persistence = createMemoryPersistence(snapshotA);
  const testScheduler = createTestScheduler();
  const coordinator = createArchitectureAutosaveCoordinator({
    initialSnapshot: snapshotA,
    delay: 1_500,
    scheduler: testScheduler.scheduler,
    save: persistence.save,
    onStatusChange: () => undefined,
  });

  coordinator.observe(snapshotB);
  testScheduler.flush();
  await flushPromises();

  assert.deepEqual(persistence.load(), snapshotB);
  assert.equal(coordinator.isDirty(), false);
});

test("an older completion leaves a newer snapshot dirty until it is committed", async () => {
  const snapshotA = createSnapshot("In-flight A");
  const snapshotB = createSnapshot("Queued B", 470);
  let persistedSnapshot = structuredClone(snapshotA);
  const writes: Array<{
    snapshot: ArchitectureSnapshot;
    complete: () => void;
  }> = [];
  const coordinator = createArchitectureAutosaveCoordinator({
    initialSnapshot: snapshotA,
    delay: 1_500,
    save: (snapshot) =>
      new Promise((resolve) => {
        writes.push({
          snapshot,
          complete: () => {
            persistedSnapshot = structuredClone(snapshot);
            resolve(true);
          },
        });
      }),
    onStatusChange: () => undefined,
  });

  const firstSave = coordinator.saveNow(snapshotA);
  coordinator.observe(snapshotB);
  const latestSave = coordinator.saveNow(snapshotB);

  writes[0]?.complete();
  assert.equal(await firstSave, true);
  await flushPromises();

  assert.deepEqual(persistedSnapshot, snapshotA);
  assert.equal(coordinator.isDirty(), true);
  assert.equal(coordinator.getStatus(), "saving");
  assert.deepEqual(writes[1]?.snapshot, snapshotB);

  writes[1]?.complete();
  assert.equal(await latestSave, true);
  await flushPromises();

  assert.deepEqual(persistedSnapshot, snapshotB);
  assert.equal(coordinator.isDirty(), false);
  assert.equal(coordinator.getStatus(), "saved");
});
