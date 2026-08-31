import { asc, desc, eq } from "drizzle-orm";

import type { Project } from "@/types/architecture";

import { mapProjectFromRow } from "./architecture-mapper";
import { getDatabase } from "./client";
import { projects } from "./schema";

const PROJECT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PROJECT_NAME_LENGTH = 128;
const MAX_PROJECT_DESCRIPTION_LENGTH = 500;

export function isProjectId(value: unknown): value is string {
  return typeof value === "string" && PROJECT_ID_PATTERN.test(value);
}

function parseProjectName(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Invalid project name.");
  }

  const name = value.trim();

  if (
    name.length === 0 ||
    name.length > MAX_PROJECT_NAME_LENGTH ||
    name.includes("\u0000")
  ) {
    throw new Error("Invalid project name.");
  }

  return name;
}

function parseProjectDescription(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    typeof value !== "string" ||
    value.length > MAX_PROJECT_DESCRIPTION_LENGTH ||
    value.includes("\u0000")
  ) {
    throw new Error("Invalid project description.");
  }

  return value.trim() || undefined;
}

export async function listProjects(): Promise<Project[]> {
  const rows = await getDatabase()
    .select()
    .from(projects)
    .orderBy(desc(projects.updatedAt), asc(projects.name), asc(projects.id));

  return rows.map(mapProjectFromRow);
}

export async function createProject(
  nameInput: unknown,
  descriptionInput?: unknown,
): Promise<Project> {
  const name = parseProjectName(nameInput);
  const description = parseProjectDescription(descriptionInput);
  const [row] = await getDatabase()
    .insert(projects)
    .values({ name, description: description ?? null })
    .returning();

  if (!row) {
    throw new Error("Project creation failed.");
  }

  return mapProjectFromRow(row);
}

export async function renameProject(
  projectId: unknown,
  nameInput: unknown,
): Promise<Project | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  const name = parseProjectName(nameInput);
  const [row] = await getDatabase()
    .update(projects)
    .set({ name, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning();

  return row ? mapProjectFromRow(row) : null;
}

export async function deleteProject(projectId: unknown): Promise<boolean> {
  if (!isProjectId(projectId)) {
    return false;
  }

  const deletedRows = await getDatabase()
    .delete(projects)
    .where(eq(projects.id, projectId))
    .returning({ id: projects.id });

  return deletedRows.length > 0;
}
