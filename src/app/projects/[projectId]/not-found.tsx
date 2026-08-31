import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <main className="grid h-dvh place-items-center bg-[#f5f5f2] px-6 text-[#242421]">
      <section className="w-full max-w-md border border-[#dfdfda] bg-white p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#73736d]">
          Project not found
        </p>
        <h1 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
          This project does not exist
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-[#73736d]">
          It may have been deleted, or the project URL is invalid.
        </p>
        <Link
          href="/projects"
          className="mt-5 inline-flex rounded-[3px] border border-[#292927] bg-[#292927] px-3 py-1.5 text-[11px] font-medium text-white"
        >
          Back to projects
        </Link>
      </section>
    </main>
  );
}
