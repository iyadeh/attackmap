CREATE TABLE "finding_dispositions" (
	"project_id" uuid NOT NULL,
	"finding_id" text NOT NULL,
	"rationale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "finding_dispositions_project_id_finding_id_pk" PRIMARY KEY("project_id","finding_id"),
	CONSTRAINT "finding_dispositions_finding_id_length" CHECK (char_length("finding_dispositions"."finding_id") between 1 and 256),
	CONSTRAINT "finding_dispositions_rationale_length" CHECK (char_length(btrim("finding_dispositions"."rationale")) between 1 and 1000)
);
--> statement-breakpoint
ALTER TABLE "finding_dispositions" ADD CONSTRAINT "finding_dispositions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;