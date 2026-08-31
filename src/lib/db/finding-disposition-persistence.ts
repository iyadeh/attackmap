import { and, asc, eq } from "drizzle-orm";

import {
  parseAcceptedRiskInput,
  parseDispositionFindingId,
} from "../findings/finding-dispositions";
import type { FindingDisposition } from "../../types/security";

import { getDatabase } from "./client";
import { isProjectId } from "./project-persistence";
import {
  findingDispositions,
  projects,
  type FindingDispositionRow,
} from "./schema";

function mapFindingDisposition(
  row: FindingDispositionRow,
): FindingDisposition {
  return {
    projectId: row.projectId,
    findingId: row.findingId,
    status: "accepted",
    rationale: row.rationale,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function loadFindingDispositions(
  projectId: unknown,
): Promise<FindingDisposition[] | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  return getDatabase().transaction(
    async (transaction) => {
      const [project] = await transaction
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        return null;
      }

      const rows = await transaction
        .select()
        .from(findingDispositions)
        .where(eq(findingDispositions.projectId, projectId))
        .orderBy(asc(findingDispositions.findingId));

      return rows.map(mapFindingDisposition);
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

export async function acceptFindingRisk(
  projectId: unknown,
  findingIdInput: unknown,
  rationaleInput: unknown,
): Promise<FindingDisposition | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  const input = parseAcceptedRiskInput(findingIdInput, rationaleInput);

  return getDatabase().transaction(async (transaction) => {
    const [project] = await transaction
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return null;
    }

    const [row] = await transaction
      .insert(findingDispositions)
      .values({
        projectId,
        findingId: input.findingId,
        rationale: input.rationale,
      })
      .onConflictDoUpdate({
        target: [
          findingDispositions.projectId,
          findingDispositions.findingId,
        ],
        set: {
          rationale: input.rationale,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      throw new Error("Finding disposition was not persisted.");
    }

    return mapFindingDisposition(row);
  });
}

export async function reopenFinding(
  projectId: unknown,
  findingIdInput: unknown,
): Promise<boolean | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  const findingId = parseDispositionFindingId(findingIdInput);

  return getDatabase().transaction(async (transaction) => {
    const [project] = await transaction
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return null;
    }

    await transaction
      .delete(findingDispositions)
      .where(
        and(
          eq(findingDispositions.projectId, projectId),
          eq(findingDispositions.findingId, findingId),
        ),
      );

    return true;
  });
}
