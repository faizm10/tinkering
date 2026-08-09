CREATE TYPE "public"."activity_action" AS ENUM('created', 'updated', 'completed', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."agent_run_status" AS ENUM('running', 'completed', 'failed', 'awaiting_clarification');--> statement-breakpoint
CREATE TYPE "public"."life_event_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('scheduled', 'sent', 'dismissed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."waiting_item_status" AS ENUM('waiting', 'follow_up_due', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" "activity_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"description" text NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"original_input" text NOT NULL,
	"conversation_context_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"proposed_plan_json" jsonb NOT NULL,
	"status" "proposal_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"proposal_id" uuid,
	"input" text NOT NULL,
	"status" "agent_run_status" DEFAULT 'running' NOT NULL,
	"model" text NOT NULL,
	"step_count" integer DEFAULT 0 NOT NULL,
	"tool_calls_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "life_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"status" "life_event_status" DEFAULT 'active' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"timezone" text NOT NULL,
	"reminder_preference" text DEFAULT 'morning' NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"task_id" uuid,
	"life_event_id" uuid,
	"title" text NOT NULL,
	"remind_at" timestamp with time zone NOT NULL,
	"status" "reminder_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"life_event_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"source" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waiting_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"life_event_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"waiting_on" text NOT NULL,
	"expected_by" date,
	"follow_up_date" date,
	"status" "waiting_item_status" DEFAULT 'waiting' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_proposal_id_agent_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."agent_proposals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "life_events" ADD CONSTRAINT "life_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_life_event_id_life_events_id_fk" FOREIGN KEY ("life_event_id") REFERENCES "public"."life_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_life_event_id_life_events_id_fk" FOREIGN KEY ("life_event_id") REFERENCES "public"."life_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_items" ADD CONSTRAINT "waiting_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_items" ADD CONSTRAINT "waiting_items_life_event_id_life_events_id_fk" FOREIGN KEY ("life_event_id") REFERENCES "public"."life_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_proposals_user_id_idx" ON "agent_proposals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_proposals_status_idx" ON "agent_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_proposals_user_status_idx" ON "agent_proposals" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "agent_runs_user_id_idx" ON "agent_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_runs_status_idx" ON "agent_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "life_events_user_id_idx" ON "life_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "life_events_status_idx" ON "life_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "life_events_end_date_idx" ON "life_events" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "life_events_user_status_idx" ON "life_events" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "profiles_user_id_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_user_id_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_remind_at_idx" ON "reminders" USING btree ("remind_at");--> statement-breakpoint
CREATE INDEX "reminders_status_idx" ON "reminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_life_event_id_idx" ON "tasks" USING btree ("life_event_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "tasks_user_status_due_idx" ON "tasks" USING btree ("user_id","status","due_date");--> statement-breakpoint
CREATE INDEX "waiting_items_user_id_idx" ON "waiting_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "waiting_items_follow_up_date_idx" ON "waiting_items" USING btree ("follow_up_date");--> statement-breakpoint
CREATE INDEX "waiting_items_status_idx" ON "waiting_items" USING btree ("status");--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "life_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "waiting_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_proposals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "profiles_user_isolation" ON "profiles" USING ("user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("user_id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "life_events_user_isolation" ON "life_events" USING ("user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("user_id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "tasks_user_isolation" ON "tasks" USING ("user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("user_id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "reminders_user_isolation" ON "reminders" USING ("user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("user_id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "waiting_items_user_isolation" ON "waiting_items" USING ("user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("user_id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "agent_proposals_user_isolation" ON "agent_proposals" USING ("user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("user_id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "agent_runs_user_isolation" ON "agent_runs" USING ("user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("user_id" = current_setting('app.current_user_id', true));--> statement-breakpoint
CREATE POLICY "activity_logs_user_isolation" ON "activity_logs" USING ("user_id" = current_setting('app.current_user_id', true)) WITH CHECK ("user_id" = current_setting('app.current_user_id', true));
