CREATE TYPE "public"."reminder_delivery_status" AS ENUM('pending', 'scheduled', 'sending', 'sent', 'failed', 'skipped', 'cancelled');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "notification_email" text;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "delivery_channel" text DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "delivery_status" "reminder_delivery_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "delivery_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "delivery_recipient_email" text;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "qstash_message_id" text;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "last_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "failure_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "last_error" text;--> statement-breakpoint
CREATE INDEX "reminders_delivery_status_idx" ON "reminders" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX "reminders_due_delivery_idx" ON "reminders" USING btree ("status","delivery_status","remind_at");