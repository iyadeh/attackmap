"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Graph } from "@phosphor-icons/react";

import {
  createProjectAction,
  type ListProjectsActionResult,
} from "@/app/actions";

type ProjectsViewProps = {
  initialResult: ListProjectsActionResult;
};

export function ProjectsView({ initialResult }: ProjectsViewProps) {
  const router = useRouter();
  const projects = initialResult.ok ? initialResult.projects : [];
  const [name, setName] = useState("Untitled architecture");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    initialResult.ok ? null : "Could not load projects.",
  );

  async function createNewProject() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await createProjectAction(trimmedName);

      if (!result.ok) {
        setError("Could not create project.");
        return;
      }

      router.push(`/projects/${result.project.id}`);
    } catch {
      setError("Could not create project.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex h-dvh min-w-[720px] flex-col overflow-hidden bg-[#f5f5f2] text-[#242421]">
      <header className="flex h-12 shrink-0 items-center border-b border-[#dfdfda] bg-white px-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-6 w-6 place-items-center bg-[#242421] text-white">
            <Graph size={15} weight="bold" aria-hidden="true" />
          </span>
          <span className="text-[13px] font-semibold tracking-[-0.02em]">
            AttackMap
          </span>
        </div>
        <span className="mx-4 h-4 w-px bg-[#e7e7e2]" />
        <span className="text-[11px] font-medium text-[#555550]">Projects</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-end justify-between gap-6 border-b border-[#dfdfda] pb-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#777770]">
                Architecture projects
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-[-0.025em]">
                Projects
              </h1>
            </div>

            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void createNewProject();
              }}
            >
              <label htmlFor="new-project-name" className="sr-only">
                New project name
              </label>
              <input
                id="new-project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={128}
                disabled={pending}
                className="h-8 w-52 rounded-[3px] border border-[#cfcfc9] bg-white px-2.5 text-[11px] text-[#343431] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={pending}
                className="h-8 rounded-[3px] border border-[#292927] bg-[#292927] px-3 text-[10px] font-medium text-white hover:bg-[#3b3b38] disabled:opacity-45"
              >
                {pending ? "Creating…" : "Create project"}
              </button>
            </form>
          </div>

          {error ? (
            <p role="alert" className="border-b border-[#ead8d6] py-3 text-[11px] text-[#913c39]">
              {error}
            </p>
          ) : null}

          {projects.length === 0 && initialResult.ok ? (
            <div className="border-b border-[#dfdfda] py-8">
              <p className="text-[12px] font-medium text-[#494945]">
                No projects yet.
              </p>
              <p className="mt-1 text-[11px] text-[#777770]">
                Create one to start with an empty architecture.
              </p>
            </div>
          ) : (
            <ul>
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-center gap-5 border-b border-[#dfdfda] py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-[#343431]">
                      {project.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[9px] text-[#92928c]">
                      {project.id}
                    </p>
                    {project.description ? (
                      <p className="mt-1 truncate text-[10px] text-[#777770]">
                        {project.description}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="rounded-[3px] border border-[#d8d8d2] bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#4f4f4a] hover:bg-[#f5f5f1]"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
