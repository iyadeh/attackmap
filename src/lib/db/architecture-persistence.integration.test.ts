import assert from "node:assert/strict";
import test from "node:test";

import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";

import type {
  ArchitectureSnapshot,
  Project,
  ServiceNode,
} from "../../types/architecture";

import { projects } from "./schema";

loadEnvConfig(process.cwd());

const integrationProject: Project = {
  id: "00000000-0000-4000-8000-000000000099",
  name: "Architecture persistence integration test",
  description: "Isolated project removed after the test.",
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
  encryptionAtRest: false,
  rateLimiting: false,
  sensitiveData: true,
  dataClassification: "restricted",
};

test("save and load replace one isolated architecture snapshot", async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for persistence integration tests.");
  }

  const { closeDatabase, getDatabase } = await import("./client");
  const { loadArchitectureProject, saveArchitectureProject } = await import(
    "./architecture-persistence"
  );
  const database = getDatabase();
  const initialSnapshot: ArchitectureSnapshot = {
    services: [apiService, databaseService],
    servicePositions: [
      { serviceId: apiService.id, x: 140.5, y: 80.25 },
      { serviceId: databaseService.id, x: 510.75, y: 240.5 },
    ],
    connections: [
      {
        id: "api-to-database",
        source: apiService.id,
        target: databaseService.id,
        protocol: "tcp",
        encrypted: true,
      },
    ],
  };

  try {
    await database
      .delete(projects)
      .where(eq(projects.id, integrationProject.id));

    assert.equal(
      await loadArchitectureProject(integrationProject.id),
      null,
    );

    await saveArchitectureProject(integrationProject, initialSnapshot);
    await closeDatabase();

    const loadedInitial = await loadArchitectureProject(integrationProject.id);

    assert.deepEqual(loadedInitial, {
      project: integrationProject,
      ...initialSnapshot,
    });

    await assert.rejects(
      saveArchitectureProject(integrationProject, {
        ...initialSnapshot,
        servicePositions: [],
      }),
      /invalid references/,
    );
    assert.deepEqual(
      await loadArchitectureProject(integrationProject.id),
      loadedInitial,
    );

    const replacementSnapshot: ArchitectureSnapshot = {
      services: [databaseService],
      servicePositions: [
        { serviceId: databaseService.id, x: -75, y: 320 },
      ],
      connections: [],
    };

    await saveArchitectureProject(integrationProject, replacementSnapshot);

    const loadedReplacement = await loadArchitectureProject(
      integrationProject.id,
    );

    assert.deepEqual(loadedReplacement, {
      project: integrationProject,
      ...replacementSnapshot,
    });
  } finally {
    await getDatabase()
      .delete(projects)
      .where(eq(projects.id, integrationProject.id));
    await closeDatabase();
  }
});
