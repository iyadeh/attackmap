"use server";

import { revalidatePath } from "next/cache";

import {
  loadArchitectureProject,
  saveArchitectureProject,
} from "@/lib/db/architecture-persistence";
import {
  createProject,
  deleteProject,
  isProjectId,
  listProjects,
  renameProject,
} from "@/lib/db/project-persistence";
import type { Project, ProjectArchitecture } from "@/types/architecture";

export type SaveArchitectureActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type LoadArchitectureActionResult =
  | { ok: true; architecture: ProjectArchitecture | null }
  | { ok: false; error: string };

export type ListProjectsActionResult =
  | { ok: true; projects: Project[] }
  | { ok: false; error: string };

export type ProjectActionResult =
  | { ok: true; project: Project }
  | { ok: false; error: string };

export type DeleteProjectActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveArchitectureAction(
  projectId: unknown,
  input: unknown,
): Promise<SaveArchitectureActionResult> {
  if (!isProjectId(projectId)) {
    return { ok: false, error: "Invalid project." };
  }

  try {
    await saveArchitectureProject(projectId, input);

    return { ok: true };
  } catch (error) {
    console.error("Failed to save project architecture.", error);

    return { ok: false, error: "Could not save architecture." };
  }
}

export async function loadArchitectureAction(
  projectId: unknown,
): Promise<LoadArchitectureActionResult> {
  if (!isProjectId(projectId)) {
    return { ok: true, architecture: null };
  }

  try {
    const architecture = await loadArchitectureProject(projectId);

    return { ok: true, architecture };
  } catch (error) {
    console.error("Failed to load project architecture.", error);

    return { ok: false, error: "Could not load saved architecture." };
  }
}

export async function listProjectsAction(): Promise<ListProjectsActionResult> {
  try {
    return { ok: true, projects: await listProjects() };
  } catch (error) {
    console.error("Failed to list projects.", error);

    return { ok: false, error: "Could not load projects." };
  }
}

export async function createProjectAction(
  name: unknown,
): Promise<ProjectActionResult> {
  try {
    const project = await createProject(name);
    revalidatePath("/projects");

    return { ok: true, project };
  } catch (error) {
    console.error("Failed to create project.", error);

    return { ok: false, error: "Could not create project." };
  }
}

export async function renameProjectAction(
  projectId: unknown,
  name: unknown,
): Promise<ProjectActionResult> {
  try {
    const project = await renameProject(projectId, name);

    if (!project) {
      return { ok: false, error: "Project not found." };
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${project.id}`);

    return { ok: true, project };
  } catch (error) {
    console.error("Failed to rename project.", error);

    return { ok: false, error: "Could not rename project." };
  }
}

export async function deleteProjectAction(
  projectId: unknown,
): Promise<DeleteProjectActionResult> {
  try {
    const deleted = await deleteProject(projectId);

    if (!deleted) {
      return { ok: false, error: "Project not found." };
    }

    revalidatePath("/projects");

    return { ok: true };
  } catch (error) {
    console.error("Failed to delete project.", error);

    return { ok: false, error: "Could not delete project." };
  }
}
