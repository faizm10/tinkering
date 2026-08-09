CREATE TYPE "public"."activity_action" AS ENUM('created', 'updated', 'completed', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."agent_run_status" AS ENUM('created', 'running', 'awaiting_clarification', 'ready_for_review', 'approved', 'rejected', 'failed', 'expired', 'completed');--> statement-breakpoint
CREATE TYPE "public"."life_event_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('scheduled', 'sent', 'dismissed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."waiting_item_status" AS ENUM('waiting', 'follow_up_due', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"actor" text DEFAULT 'system' NOT NULL,
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
	"provider" text DEFAULT 'mock' NOT NULL,
	"status" "agent_run_status" DEFAULT 'running' NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text DEFAULT 'sonae-v1' NOT NULL,
	"step_count" integer DEFAULT 0 NOT NULL,
	"tool_calls_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"progress_events_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"usage_json" jsonb,
	"error_category" text,
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
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_proposal_id_agent_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."agent_proposals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_life_event_id_life_events_id_fk" FOREIGN KEY ("life_event_id") REFERENCES "public"."life_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_life_event_id_life_events_id_fk" FOREIGN KEY ("life_event_id") REFERENCES "public"."life_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_items" ADD CONSTRAINT "waiting_items_life_event_id_life_events_id_fk" FOREIGN KEY ("life_event_id") REFERENCES "public"."life_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "tasks_user_id_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_life_event_id_idx" ON "tasks" USING btree ("life_event_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "tasks_user_status_due_idx" ON "tasks" USING btree ("user_id","status","due_date");--> statement-breakpoint
CREATE INDEX "waiting_items_user_id_idx" ON "waiting_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "waiting_items_follow_up_date_idx" ON "waiting_items" USING btree ("follow_up_date");--> statement-breakpoint
CREATE INDEX "waiting_items_status_idx" ON "waiting_items" USING btree ("status");