import { asc, eq } from "drizzle-orm";

import type { ProjectArchitecture } from "@/types/architecture";

import {
  mapArchitectureFromRows,
  mapArchitectureToRows,
  parseArchitectureSnapshot,
} from "./architecture-mapper";
import { getDatabase } from "./client";
import { isProjectId } from "./project-persistence";
import { projects, serviceConnections, services } from "./schema";

export async function loadArchitectureProject(
  projectId: string,
): Promise<ProjectArchitecture | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  const database = getDatabase();

  return database.transaction(
    async (transaction) => {
      const [projectRow] = await transaction
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!projectRow) {
        return null;
      }

      const serviceRows = await transaction
        .select()
        .from(services)
        .where(eq(services.projectId, projectId))
        .orderBy(asc(services.id));
      const connectionRows = await transaction
        .select()
        .from(serviceConnections)
        .where(eq(serviceConnections.projectId, projectId))
        .orderBy(asc(serviceConnections.id));

      return mapArchitectureFromRows(
        projectRow,
        serviceRows,
        connectionRows,
      );
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

export async function saveArchitectureProject(
  projectId: string,
  input: unknown,
): Promise<void> {
  if (!isProjectId(projectId)) {
    throw new Error("Architecture project not found.");
  }

  const snapshot = parseArchitectureSnapshot(input);
  const { serviceRows, connectionRows } = mapArchitectureToRows(
    projectId,
    snapshot,
  );
  const database = getDatabase();

  await database.transaction(async (transaction) => {
    const updatedProjects = await transaction
      .update(projects)
      .set({ updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning({ id: projects.id });

    if (updatedProjects.length === 0) {
      throw new Error("Architecture project not found.");
    }

    await transaction
      .delete(serviceConnections)
      .where(eq(serviceConnections.projectId, projectId));
    await transaction
      .delete(services)
      .where(eq(services.projectId, projectId));

    if (serviceRows.length > 0) {
      await transaction.insert(services).values(serviceRows);
    }

    if (connectionRows.length > 0) {
      await transaction.insert(serviceConnections).values(connectionRows);
    }
  });
}
