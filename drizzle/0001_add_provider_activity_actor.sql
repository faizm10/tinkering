ALTER TABLE "agent_runs" ADD COLUMN "provider" text DEFAULT 'mock' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "actor" text DEFAULT 'system' NOT NULL;
