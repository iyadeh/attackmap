CREATE TYPE "public"."authentication_method" AS ENUM('none', 'session', 'jwt', 'oauth2', 'oidc', 'api_key', 'mtls');--> statement-breakpoint
CREATE TYPE "public"."authorization_model" AS ENUM('none', 'rbac', 'abac', 'acl', 'policy');--> statement-breakpoint
CREATE TYPE "public"."connection_protocol" AS ENUM('https', 'http', 'grpc', 'tcp', 'websocket');--> statement-breakpoint
CREATE TYPE "public"."data_classification" AS ENUM('public', 'internal', 'confidential', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."service_exposure" AS ENUM('public', 'private', 'internal');--> statement-breakpoint
CREATE TYPE "public"."service_protocol" AS ENUM('https', 'tcp_tls');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('internet', 'web', 'mobile', 'api', 'gateway', 'backend', 'auth', 'database', 'cache', 'storage', 'queue', 'third_party');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_connections" (
	"id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"source_service_id" text NOT NULL,
	"target_service_id" text NOT NULL,
	"protocol" "connection_protocol" NOT NULL,
	"encrypted" boolean NOT NULL,
	CONSTRAINT "service_connections_project_id_id_pk" PRIMARY KEY("project_id","id"),
	CONSTRAINT "service_connections_project_source_target_unique" UNIQUE("project_id","source_service_id","target_service_id"),
	CONSTRAINT "service_connections_no_self_connection" CHECK ("service_connections"."source_service_id" <> "service_connections"."target_service_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "service_type" NOT NULL,
	"technology" text NOT NULL,
	"exposure" "service_exposure" NOT NULL,
	"protocol" "service_protocol" NOT NULL,
	"authentication" "authentication_method" NOT NULL,
	"authorization" "authorization_model" NOT NULL,
	"encryption_in_transit" boolean NOT NULL,
	"encryption_at_rest" boolean,
	"rate_limiting" boolean NOT NULL,
	"sensitive_data" boolean NOT NULL,
	"data_classification" "data_classification" NOT NULL,
	"position_x" double precision NOT NULL,
	"position_y" double precision NOT NULL,
	CONSTRAINT "services_project_id_id_pk" PRIMARY KEY("project_id","id")
);
--> statement-breakpoint
ALTER TABLE "service_connections" ADD CONSTRAINT "service_connections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_connections" ADD CONSTRAINT "service_connections_source_service_fk" FOREIGN KEY ("project_id","source_service_id") REFERENCES "public"."services"("project_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_connections" ADD CONSTRAINT "service_connections_target_service_fk" FOREIGN KEY ("project_id","target_service_id") REFERENCES "public"."services"("project_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_connections_target_service_idx" ON "service_connections" USING btree ("project_id","target_service_id");