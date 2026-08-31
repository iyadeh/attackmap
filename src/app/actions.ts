"use server";

import { DEVELOPMENT_PROJECT } from "@/lib/architecture/development-project";
import {
  loadArchitectureProject,
  saveArchitectureProject,
} from "@/lib/db/architecture-persistence";
import type { ProjectArchitecture } from "@/types/architecture";

export type SaveArchitectureActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type LoadArchitectureActionResult =
  | { ok: true; architecture: ProjectArchitecture | null }
  | { ok: false; error: string };

export async function saveArchitectureAction(
  input: unknown,
): Promise<SaveArchitectureActionResult> {
  try {
    await saveArchitectureProject(DEVELOPMENT_PROJECT, input);

    return { ok: true };
  } catch (error) {
    console.error("Failed to save development architecture.", error);

    return { ok: false, error: "Could not save architecture." };
  }
}

export async function loadArchitectureAction(): Promise<LoadArchitectureActionResult> {
  try {
    const architecture = await loadArchitectureProject(
      DEVELOPMENT_PROJECT.id,
    );

    return { ok: true, architecture };
  } catch (error) {
    console.error("Failed to load development architecture.", error);

    return { ok: false, error: "Could not load saved architecture." };
  }
}
