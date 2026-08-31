import { asc, eq } from "drizzle-orm";

import type { Project, ProjectArchitecture } from "@/types/architecture";

import {
  mapArchitectureFromRows,
  mapArchitectureToRows,
  parseArchitectureSnapshot,
} from "./architecture-mapper";
import { getDatabase } from "./client";
import { projects, serviceConnections, services } from "./schema";

export async function loadArchitectureProject(
  projectId: string,
): Promise<ProjectArchitecture | null> {
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
  project: Project,
  input: unknown,
): Promise<void> {
  const snapshot = parseArchitectureSnapshot(input);
  const { serviceRows, connectionRows } = mapArchitectureToRows(
    project.id,
    snapshot,
  );
  const database = getDatabase();

  await database.transaction(async (transaction) => {
    await transaction
      .insert(projects)
      .values({
        id: project.id,
        name: project.name,
        description: project.description ?? null,
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          name: project.name,
          description: project.description ?? null,
          updatedAt: new Date(),
        },
      });

    await transaction
      .delete(serviceConnections)
      .where(eq(serviceConnections.projectId, project.id));
    await transaction
      .delete(services)
      .where(eq(services.projectId, project.id));

    if (serviceRows.length > 0) {
      await transaction.insert(services).values(serviceRows);
    }

    if (connectionRows.length > 0) {
      await transaction.insert(serviceConnections).values(connectionRows);
    }
  });
}
