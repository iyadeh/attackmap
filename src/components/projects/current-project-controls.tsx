"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteProjectAction,
  renameProjectAction,
} from "@/app/actions";
import type { Project } from "@/types/architecture";

type CurrentProjectControlsProps = {
  project: Project;
  onRenamed: (project: Project) => void;
};

export function CurrentProjectControls({
  project,
  onRenamed,
}: CurrentProjectControlsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "rename" | "delete">("idle");
  const [name, setName] = useState(project.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function renameCurrentProject() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await renameProjectAction(project.id, trimmedName);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onRenamed(result.project);
      setName(result.project.name);
      setMode("idle");
    } catch {
      setError("Could not rename project.");
    } finally {
      setPending(false);
    }
  }

  async function deleteCurrentProject() {
    setPending(true);
    setError(null);

    try {
      const result = await deleteProjectAction(project.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.replace("/projects");
    } catch {
      setError("Could not delete project.");
    } finally {
      setPending(false);
    }
  }

  if (mode === "rename") {
    return (
      <form
        className="flex min-w-0 items-center gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          void renameCurrentProject();
        }}
      >
        <input
          aria-label="Project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={128}
          disabled={pending}
          autoFocus
          className="h-7 w-44 rounded-[3px] border border-[#cfcfc9] bg-white px-2 text-[11px] text-[#343431] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-7 rounded-[3px] border border-[#292927] bg-[#292927] px-2 text-[10px] font-medium text-white disabled:opacity-45"
        >
          {pending ? "Saving…" : "Apply"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setName(project.name);
            setError(null);
            setMode("idle");
          }}
          className="h-7 px-1.5 text-[10px] text-[#777770] hover:text-[#343431] disabled:opacity-45"
        >
          Cancel
        </button>
        {error ? (
          <span
            role="alert"
            title={error}
            className="max-w-32 truncate text-[9px] text-[#913c39]"
          >
            {error}
          </span>
        ) : null}
      </form>
    );
  }

  if (mode === "delete") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#777770]">Delete project?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => void deleteCurrentProject()}
          className="h-7 rounded-[3px] border border-[#a8605c] px-2 text-[10px] font-medium text-[#913c39] hover:bg-[#f9eeee] disabled:opacity-45"
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            setMode("idle");
          }}
          className="h-7 px-1.5 text-[10px] text-[#777770] hover:text-[#343431] disabled:opacity-45"
        >
          Cancel
        </button>
        {error ? (
          <span
            role="alert"
            title={error}
            className="max-w-32 truncate text-[9px] text-[#913c39]"
          >
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setName(project.name);
          setError(null);
          setMode("rename");
        }}
        className="text-[9px] text-[#8a8a84] hover:text-[#343431]"
      >
        Rename
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setMode("delete");
        }}
        className="text-[9px] text-[#9a5b57] hover:text-[#913c39]"
      >
        Delete
      </button>
    </div>
  );
}
