import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const lifeEventStatus = pgEnum("life_event_status", ["draft", "active", "completed", "archived"]);
export const taskStatus = pgEnum("task_status", ["pending", "in_progress", "completed", "cancelled"]);
export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);
export const reminderStatus = pgEnum("reminder_status", ["scheduled", "sent", "dismissed", "cancelled"]);
export const waitingItemStatus = pgEnum("waiting_item_status", ["waiting", "follow_up_due", "resolved", "cancelled"]);
export const proposalStatus = pgEnum("proposal_status", ["pending", "approved", "rejected", "expired"]);
export const agentRunStatus = pgEnum("agent_run_status", [
  "created",
  "running",
  "awaiting_clarification",
  "ready_for_review",
  "approved",
  "rejected",
  "failed",
  "expired",
  "completed",
]);
export const activityAction = pgEnum("activity_action", ["created", "updated", "completed", "approved", "rejected", "archived"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    timezone: text("timezone").notNull(),
    reminderPreference: text("reminder_preference").notNull().default("morning"),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("profiles_user_id_idx").on(table.userId),
  }),
);

export const lifeEvents = pgTable(
  "life_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("general"),
    status: lifeEventStatus("status").notNull().default("active"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("life_events_user_id_idx").on(table.userId),
    statusIdx: index("life_events_status_idx").on(table.status),
    endDateIdx: index("life_events_end_date_idx").on(table.endDate),
    userStatusIdx: index("life_events_user_status_idx").on(table.userId, table.status),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    lifeEventId: uuid("life_event_id").references(() => lifeEvents.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: taskStatus("status").notNull().default("pending"),
    priority: taskPriority("priority").notNull().default("medium"),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    source: text("source").notNull().default("user"),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("tasks_user_id_idx").on(table.userId),
    eventIdx: index("tasks_life_event_id_idx").on(table.lifeEventId),
    statusIdx: index("tasks_status_idx").on(table.status),
    dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
    userStatusDueIdx: index("tasks_user_status_due_idx").on(table.userId, table.status, table.dueDate),
  }),
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    lifeEventId: uuid("life_event_id").references(() => lifeEvents.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    remindAt: timestamp("remind_at", { withTimezone: true }).notNull(),
    status: reminderStatus("status").notNull().default("scheduled"),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("reminders_user_id_idx").on(table.userId),
    remindAtIdx: index("reminders_remind_at_idx").on(table.remindAt),
    statusIdx: index("reminders_status_idx").on(table.status),
  }),
);

export const waitingItems = pgTable(
  "waiting_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    lifeEventId: uuid("life_event_id").references(() => lifeEvents.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    waitingOn: text("waiting_on").notNull(),
    expectedBy: date("expected_by"),
    followUpDate: date("follow_up_date"),
    status: waitingItemStatus("status").notNull().default("waiting"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("waiting_items_user_id_idx").on(table.userId),
    followUpIdx: index("waiting_items_follow_up_date_idx").on(table.followUpDate),
    statusIdx: index("waiting_items_status_idx").on(table.status),
  }),
);

export const agentProposals = pgTable(
  "agent_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    originalInput: text("original_input").notNull(),
    conversationContextJson: jsonb("conversation_context_json").$type<Record<string, unknown>>().notNull().default({}),
    proposedPlanJson: jsonb("proposed_plan_json").$type<Record<string, unknown>>().notNull(),
    status: proposalStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdx: index("agent_proposals_user_id_idx").on(table.userId),
    statusIdx: index("agent_proposals_status_idx").on(table.status),
    userStatusIdx: index("agent_proposals_user_status_idx").on(table.userId, table.status),
  }),
);

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    proposalId: uuid("proposal_id").references(() => agentProposals.id, { onDelete: "set null" }),
    input: text("input").notNull(),
    provider: text("provider").notNull().default("mock"),
    status: agentRunStatus("status").notNull().default("running"),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull().default("sonae-v1"),
    stepCount: integer("step_count").notNull().default(0),
    toolCallsJson: jsonb("tool_calls_json").$type<Array<Record<string, unknown>>>().notNull().default([]),
    progressEventsJson: jsonb("progress_events_json").$type<Array<Record<string, unknown>>>().notNull().default([]),
    usageJson: jsonb("usage_json").$type<Record<string, unknown>>(),
    errorCategory: text("error_category"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    userIdx: index("agent_runs_user_id_idx").on(table.userId),
    statusIdx: index("agent_runs_status_idx").on(table.status),
  }),
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    actor: text("actor").notNull().default("system"),
    action: activityAction("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    description: text("description").notNull(),
    metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("activity_logs_user_id_idx").on(table.userId),
    createdAtIdx: index("activity_logs_created_at_idx").on(table.createdAt),
  }),
);

export const lifeEventsRelations = relations(lifeEvents, ({ many }) => ({
  tasks: many(tasks),
  reminders: many(reminders),
  waitingItems: many(waitingItems),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  lifeEvent: one(lifeEvents, { fields: [tasks.lifeEventId], references: [lifeEvents.id] }),
  reminders: many(reminders),
}));

export const waitingItemsRelations = relations(waitingItems, ({ one }) => ({
  lifeEvent: one(lifeEvents, { fields: [waitingItems.lifeEventId], references: [lifeEvents.id] }),
}));
