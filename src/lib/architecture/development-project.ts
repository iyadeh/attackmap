import type { Project } from "@/types/architecture";

/** Fixed identity used until project selection and CRUD become active milestones. */
export const DEVELOPMENT_PROJECT = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "VaultShare Production",
  description: "Single development project for the AttackMap workspace.",
} as const satisfies Project;
