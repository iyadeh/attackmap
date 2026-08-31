import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { loadArchitectureAction } from "@/app/actions";
import { ArchitectureWorkspace } from "@/components/architecture/architecture-workspace";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  await connection();

  const { projectId } = await params;
  const result = await loadArchitectureAction(projectId);

  if (!result.ok) {
    return (
      <main className="grid h-dvh place-items-center bg-[#f5f5f2] px-6 text-[#242421]">
        <section className="w-full max-w-md border border-[#dfdfda] bg-white p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#913c39]">
            Project unavailable
          </p>
          <h1 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
            Could not load this project
          </h1>
          <p className="mt-2 text-[12px] leading-5 text-[#73736d]">
            Database access failed. No architecture data was replaced.
          </p>
          <div className="mt-5 flex items-center gap-3 text-[11px]">
            <a
              href={`/projects/${projectId}`}
              className="rounded-[3px] border border-[#292927] bg-[#292927] px-3 py-1.5 font-medium text-white"
            >
              Retry
            </a>
            <Link href="/projects" className="text-[#73736d] hover:text-[#343431]">
              Back to projects
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!result.architecture) {
    notFound();
  }

  return (
    <ArchitectureWorkspace
      key={result.architecture.project.id}
      initialArchitecture={result.architecture}
    />
  );
}
