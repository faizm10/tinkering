CREATE TABLE "analytics_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"allowed_origins" text[] DEFAULT '{}' NOT NULL,
	"retention_days" integer DEFAULT 90 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"day" date NOT NULL,
	"active_visitors" integer DEFAULT 0 NOT NULL,
	"identified_users" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"pageviews" integer DEFAULT 0 NOT NULL,
	"events" integer DEFAULT 0 NOT NULL,
	"event_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"referrer_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(128) NOT NULL,
	"github_login" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"visitor_id" uuid NOT NULL,
	"product_user_id" uuid,
	"session_id" uuid NOT NULL,
	"client_event_id" varchar(128) NOT NULL,
	"name" varchar(128) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"path" text,
	"referrer" text,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_id_occurred_at_pk" PRIMARY KEY("id","occurred_at")
) PARTITION BY RANGE ("occurred_at");
--> statement-breakpoint
DO $$
DECLARE
	month_start date := (date_trunc('month', current_date) - interval '1 month')::date;
	partition_start date;
	partition_end date;
	partition_name text;
BEGIN
	FOR offset_month IN 0..4 LOOP
		partition_start := (month_start + make_interval(months => offset_month))::date;
		partition_end := (partition_start + interval '1 month')::date;
		partition_name := 'events_' || to_char(partition_start, 'YYYY_MM');
		EXECUTE format(
			'CREATE TABLE %I PARTITION OF events FOR VALUES FROM (%L) TO (%L)',
			partition_name,
			partition_start,
			partition_end
		);
	END LOOP;
	CREATE TABLE events_default PARTITION OF events DEFAULT;
END $$;
--> statement-breakpoint
CREATE TABLE "github_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"installation_id" bigint NOT NULL,
	"github_account_id" bigint NOT NULL,
	"github_login" varchar(255) NOT NULL,
	"account_type" varchar(32) NOT NULL,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_analytics_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"property_id" varchar(64) NOT NULL,
	"property_name" varchar(255),
	"encrypted_credentials" text NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_analytics_daily_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"day" date NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"pageviews" integer DEFAULT 0 NOT NULL,
	"events" integer DEFAULT 0 NOT NULL,
	"event_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"referrer_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_analytics_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"status" varchar(32) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"accepted_events" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"external_id_hash" varchar(128) NOT NULL,
	"display_id" varchar(255) NOT NULL,
	"traits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installation_id" uuid NOT NULL,
	"github_repository_id" bigint NOT NULL,
	"owner" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" varchar(512) NOT NULL,
	"default_branch" varchar(255),
	"private" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"selected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"visitor_id" uuid NOT NULL,
	"product_user_id" uuid,
	"client_session_id" varchar(128) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"referrer" text,
	"landing_path" text,
	"utm" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"prefix" varchar(32) NOT NULL,
	"key_hash" varchar(128) NOT NULL,
	"kind" varchar(16) NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"anonymous_id_hash" varchar(128) NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_projects" ADD CONSTRAINT "analytics_projects_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_aggregates" ADD CONSTRAINT "daily_aggregates_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_product_user_id_product_users_id_fk" FOREIGN KEY ("product_user_id") REFERENCES "public"."product_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_account_id_dashboard_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."dashboard_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_analytics_connections" ADD CONSTRAINT "google_analytics_connections_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_analytics_daily_metrics" ADD CONSTRAINT "google_analytics_daily_metrics_connection_id_google_analytics_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."google_analytics_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_analytics_daily_metrics" ADD CONSTRAINT "google_analytics_daily_metrics_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_analytics_sync_runs" ADD CONSTRAINT "google_analytics_sync_runs_connection_id_google_analytics_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."google_analytics_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_batches" ADD CONSTRAINT "ingestion_batches_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_users" ADD CONSTRAINT "product_users_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_installation_id_github_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."github_installations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_product_user_id_product_users_id_fk" FOREIGN KEY ("product_user_id") REFERENCES "public"."product_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_keys" ADD CONSTRAINT "tracking_keys_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_project_id_analytics_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."analytics_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_project_repository_idx" ON "analytics_projects" USING btree ("repository_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_aggregates_project_day_idx" ON "daily_aggregates" USING btree ("project_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_clerk_user_idx" ON "dashboard_accounts" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_project_client_event_idx" ON "events" USING btree ("project_id","client_event_id","occurred_at");--> statement-breakpoint
CREATE INDEX "events_project_occurred_idx" ON "events" USING btree ("project_id","occurred_at");--> statement-breakpoint
CREATE INDEX "events_project_name_idx" ON "events" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "events_user_occurred_idx" ON "events" USING btree ("product_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "events_session_idx" ON "events" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_installation_id_idx" ON "github_installations" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "github_installation_account_idx" ON "github_installations" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "google_analytics_project_idx" ON "google_analytics_connections" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "google_analytics_property_idx" ON "google_analytics_connections" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "google_analytics_daily_connection_day_idx" ON "google_analytics_daily_metrics" USING btree ("connection_id","day");--> statement-breakpoint
CREATE INDEX "google_analytics_daily_project_day_idx" ON "google_analytics_daily_metrics" USING btree ("project_id","day");--> statement-breakpoint
CREATE INDEX "google_analytics_sync_runs_connection_idx" ON "google_analytics_sync_runs" USING btree ("connection_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ingestion_batches_project_key_idx" ON "ingestion_batches" USING btree ("project_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "product_users_project_external_idx" ON "product_users" USING btree ("project_id","external_id_hash");--> statement-breakpoint
CREATE INDEX "product_users_project_last_seen_idx" ON "product_users" USING btree ("project_id","last_seen_at");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_github_id_idx" ON "repositories" USING btree ("github_repository_id");--> statement-breakpoint
CREATE INDEX "repositories_installation_idx" ON "repositories" USING btree ("installation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_project_client_idx" ON "sessions" USING btree ("project_id","client_session_id");--> statement-breakpoint
CREATE INDEX "sessions_project_started_idx" ON "sessions" USING btree ("project_id","started_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("product_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_key_hash_idx" ON "tracking_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "tracking_key_project_idx" ON "tracking_keys" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "visitors_project_anon_idx" ON "visitors" USING btree ("project_id","anonymous_id_hash");--> statement-breakpoint
CREATE INDEX "visitors_project_last_seen_idx" ON "visitors" USING btree ("project_id","last_seen_at");
