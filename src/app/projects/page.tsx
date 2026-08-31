import { connection } from "next/server";

import { listProjectsAction } from "@/app/actions";
import { ProjectsView } from "@/components/projects/projects-view";

export default async function ProjectsPage() {
  await connection();

  const initialResult = await listProjectsAction();

  return <ProjectsView initialResult={initialResult} />;
}
