"use server";

import { revalidatePath } from "next/cache";

import {
  loadArchitectureProject,
  saveArchitectureProject,
} from "@/lib/db/architecture-persistence";
import {
  acceptFindingRisk,
  loadFindingDispositions,
  reopenFinding,
} from "@/lib/db/finding-disposition-persistence";
import { parseAcceptedRiskInput } from "@/lib/findings/finding-dispositions";
import {
  createProject,
  deleteProject,
  isProjectId,
  listProjects,
  renameProject,
} from "@/lib/db/project-persistence";
import type { Project, ProjectArchitecture } from "@/types/architecture";
import type { FindingDisposition } from "@/types/security";

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

export type LoadFindingDispositionsActionResult =
  | { ok: true; dispositions: FindingDisposition[] | null }
  | { ok: false; error: string };

export type AcceptFindingRiskActionResult =
  | { ok: true; disposition: FindingDisposition }
  | { ok: false; error: string };

export type ReopenFindingActionResult =
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

export async function loadFindingDispositionsAction(
  projectId: unknown,
): Promise<LoadFindingDispositionsActionResult> {
  try {
    return {
      ok: true,
      dispositions: await loadFindingDispositions(projectId),
    };
  } catch (error) {
    console.error("Failed to load finding dispositions.", error);

    return { ok: false, error: "Could not load finding dispositions." };
  }
}

export async function acceptFindingRiskAction(
  projectId: unknown,
  findingId: unknown,
  rationale: unknown,
): Promise<AcceptFindingRiskActionResult> {
  let input;

  try {
    input = parseAcceptedRiskInput(findingId, rationale);
  } catch {
    return {
      ok: false,
      error: "A non-empty rationale of at most 1000 characters is required.",
    };
  }

  try {
    const disposition = await acceptFindingRisk(
      projectId,
      input.findingId,
      input.rationale,
    );

    return disposition
      ? { ok: true, disposition }
      : { ok: false, error: "Project not found." };
  } catch (error) {
    console.error("Failed to accept finding risk.", error);

    return { ok: false, error: "Could not accept risk." };
  }
}

export async function reopenFindingAction(
  projectId: unknown,
  findingId: unknown,
): Promise<ReopenFindingActionResult> {
  try {
    const reopened = await reopenFinding(projectId, findingId);

    return reopened
      ? { ok: true }
      : { ok: false, error: "Project not found." };
  } catch (error) {
    console.error("Failed to reopen finding.", error);

    return { ok: false, error: "Could not reopen finding." };
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
