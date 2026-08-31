import assert from "node:assert/strict";
import test from "node:test";

import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";

import type { Project } from "../../types/architecture";

import { findingDispositions } from "./schema";

loadEnvConfig(process.cwd());

const findingId = "AM-006:service:shared-api";

test("accepted risk persistence is project-scoped and cascades", async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for persistence integration tests.");
  }

  const { closeDatabase, getDatabase } = await import("./client");
  const {
    acceptFindingRisk,
    loadFindingDispositions,
    reopenFinding,
  } = await import("./finding-disposition-persistence");
  const { createProject, deleteProject } = await import(
    "./project-persistence"
  );
  let projectA: Project | null = null;
  let projectB: Project | null = null;

  try {
    projectA = await createProject("Disposition isolation A");
    projectB = await createProject("Disposition isolation B");

    assert.deepEqual(await loadFindingDispositions(projectA.id), []);
    assert.deepEqual(await loadFindingDispositions(projectB.id), []);
    await assert.rejects(
      acceptFindingRisk(projectA.id, findingId, " \n\t "),
      /rationale is invalid/,
    );

    const acceptedA = await acceptFindingRisk(
      projectA.id,
      findingId,
      "Rate limiting is enforced upstream.",
    );

    assert.equal(acceptedA?.projectId, projectA.id);
    assert.equal(acceptedA?.findingId, findingId);
    assert.equal(acceptedA?.status, "accepted");
    assert.equal(acceptedA?.rationale, "Rate limiting is enforced upstream.");
    assert.deepEqual(await loadFindingDispositions(projectB.id), []);
    assert.deepEqual(await loadFindingDispositions(projectA.id), [acceptedA]);

    const acceptedB = await acceptFindingRisk(
      projectB.id,
      findingId,
      "Project B has a separate compensating control.",
    );

    assert.equal(acceptedB?.projectId, projectB.id);
    assert.equal(
      (await loadFindingDispositions(projectB.id))?.[0]?.rationale,
      "Project B has a separate compensating control.",
    );

    assert.equal(await reopenFinding(projectA.id, findingId), true);
    assert.deepEqual(await loadFindingDispositions(projectA.id), []);
    assert.equal((await loadFindingDispositions(projectB.id))?.length, 1);

    await acceptFindingRisk(
      projectA.id,
      findingId,
      "Accepted again before project deletion.",
    );
    assert.equal(await deleteProject(projectA.id), true);
    assert.deepEqual(
      await getDatabase()
        .select()
        .from(findingDispositions)
        .where(eq(findingDispositions.projectId, projectA.id)),
      [],
    );
    projectA = null;

    assert.equal((await loadFindingDispositions(projectB.id))?.length, 1);
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
