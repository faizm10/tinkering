CREATE TABLE "posthog_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"host" varchar(255) DEFAULT 'https://us.posthog.com' NOT NULL,
	"posthog_project_id" varchar(64) NOT NULL,
	"encrypted_personal_api_key" text NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vercel_analytics_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"vercel_project_id" varchar(128) NOT NULL,
	"vercel_team_id" varchar(128),
	"encrypted_token" text NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posthog_connections" ADD CONSTRAINT "posthog_connections_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vercel_analytics_connections" ADD CONSTRAINT "vercel_analytics_connections_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "posthog_project_idx" ON "posthog_connections" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vercel_analytics_project_idx" ON "vercel_analytics_connections" USING btree ("project_id");