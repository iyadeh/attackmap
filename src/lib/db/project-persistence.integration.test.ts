import assert from "node:assert/strict";
import test from "node:test";

import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";

import type { ArchitectureSnapshot, Project, ServiceNode } from "../../types/architecture";

import { serviceConnections, services } from "./schema";

loadEnvConfig(process.cwd());

const missingProjectId = "00000000-0000-4000-8000-000000000098";

function createService(name: string): ServiceNode {
  return {
    id: "shared-service",
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
  };
}

test("project CRUD preserves isolated architectures and cascade deletion", async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for persistence integration tests.");
  }

  const { closeDatabase, getDatabase } = await import("./client");
  const { loadArchitectureProject, saveArchitectureProject } = await import(
    "./architecture-persistence"
  );
  const {
    createProject,
    deleteProject,
    listProjects,
    renameProject,
  } = await import("./project-persistence");
  let projectA: Project | null = null;
  let projectB: Project | null = null;

  try {
    projectA = await createProject(
      "Isolation test A",
      "Dedicated integration project A.",
    );
    projectB = await createProject("Isolation test B");

    const listedIds = new Set(
      (await listProjects()).map((project) => project.id),
    );
    assert.equal(listedIds.has(projectA.id), true);
    assert.equal(listedIds.has(projectB.id), true);

    const emptyProjectA = await loadArchitectureProject(projectA.id);
    assert.deepEqual(emptyProjectA?.services, []);
    assert.deepEqual(emptyProjectA?.servicePositions, []);
    assert.deepEqual(emptyProjectA?.connections, []);

    const renamedProjectA = await renameProject(
      projectA.id,
      "Isolation test A renamed",
    );
    assert.equal(renamedProjectA?.name, "Isolation test A renamed");
    assert.equal(
      (await loadArchitectureProject(projectA.id))?.project.name,
      "Isolation test A renamed",
    );

    const serviceA = createService("Project A API");
    const serviceB = createService("Project B API");
    const databaseB: ServiceNode = {
      ...createService("Project B database"),
      id: "database",
      type: "database",
      technology: "PostgreSQL 17",
      protocol: "tcp_tls",
      authentication: "mtls",
      authorization: "acl",
      encryptionAtRest: true,
      sensitiveData: true,
      dataClassification: "restricted",
    };
    const snapshotA: ArchitectureSnapshot = {
      services: [serviceA],
      servicePositions: [{ serviceId: serviceA.id, x: 10, y: 20 }],
      connections: [],
    };
    const snapshotB: ArchitectureSnapshot = {
      services: [databaseB, serviceB],
      servicePositions: [
        { serviceId: databaseB.id, x: 620, y: 220 },
        { serviceId: serviceB.id, x: 300, y: 80 },
      ],
      connections: [
        {
          id: "api-to-database",
          source: serviceB.id,
          target: databaseB.id,
          protocol: "tcp",
          encrypted: true,
        },
      ],
    };

    await saveArchitectureProject(projectA.id, snapshotA);
    await saveArchitectureProject(projectB.id, snapshotB);

    const loadedA = await loadArchitectureProject(projectA.id);
    const loadedB = await loadArchitectureProject(projectB.id);

    assert.deepEqual(loadedA?.services, snapshotA.services);
    assert.deepEqual(loadedA?.servicePositions, snapshotA.servicePositions);
    assert.deepEqual(loadedA?.connections, snapshotA.connections);
    assert.deepEqual(loadedB?.services, snapshotB.services);
    assert.deepEqual(loadedB?.servicePositions, snapshotB.servicePositions);
    assert.deepEqual(loadedB?.connections, snapshotB.connections);

    assert.equal(await deleteProject(projectB.id), true);
    assert.equal(await loadArchitectureProject(projectB.id), null);
    assert.deepEqual(
      await getDatabase()
        .select()
        .from(services)
        .where(eq(services.projectId, projectB.id)),
      [],
    );
    assert.deepEqual(
      await getDatabase()
        .select()
        .from(serviceConnections)
        .where(eq(serviceConnections.projectId, projectB.id)),
      [],
    );
    projectB = null;

    assert.equal(await loadArchitectureProject(missingProjectId), null);
    assert.equal(await renameProject(missingProjectId, "Missing"), null);
    assert.equal(await deleteProject(missingProjectId), false);
    await assert.rejects(
      saveArchitectureProject(missingProjectId, snapshotA),
      /not found/,
    );
  } finally {
    if (projectA) {
      await deleteProject(projectA.id);
    }
    if (projectB) {
      await deleteProject(projectB.id);
    }
    await closeDatabase();
  }
});
