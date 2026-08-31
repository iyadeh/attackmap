import { connection } from "next/server";

import { loadArchitectureAction } from "@/app/actions";
import { ArchitectureWorkspace } from "@/components/architecture/architecture-workspace";

export default async function Home() {
  await connection();

  const initialLoadResult = await loadArchitectureAction();

  return <ArchitectureWorkspace initialLoadResult={initialLoadResult} />;
}
