import "server-only";

import { addDays } from "date-fns";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  activityLogs,
  agentProposals,
  agentRuns,
  lifeEvents,
  profiles,
  reminders,
  tasks,
  waitingItems,
} from "@/db/schema";
import { agentProposalSchema, type AgentProposal } from "@/lib/validations/proposal";
import { todayISO } from "@/lib/dates";
import type {
  CreateLifeEventInput,
  CreateReminderInput,
  CreateTaskInput,
  CreateWaitingItemInput,
  DataRepository,
} from "@/server/providers/data/repository";
import type {
  ActivityRecord,
  AgentRunRecord,
  DashboardData,
  LifeEventRecord,
  LifeEventSummary,
  ProposalRecord,
  ReminderRecord,
  TaskRecord,
  WaitingItemRecord,
} from "@/server/services/types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Tx;

function serializeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

function serializeDay(value: Date | string | null | undefined) {
  const serialized = serializeDate(value);
  return serialized?.slice(0, 10) ?? null;
}

function toEvent(row: typeof lifeEvents.$inferSelect): LifeEventRecord {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    startDate: serializeDay(row.startDate),
    endDate: serializeDay(row.endDate),
  };
}

function toTask(row: typeof tasks.$inferSelect): TaskRecord {
  return {
    id: row.id,
    userId: row.userId,
    lifeEventId: row.lifeEventId,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: serializeDay(row.dueDate),
    completedAt: serializeDate(row.completedAt),
    source: row.source,
  };
}

function toReminder(row: typeof reminders.$inferSelect): ReminderRecord {
  return {
    id: row.id,
    userId: row.userId,
    taskId: row.taskId,
    lifeEventId: row.lifeEventId,
    title: row.title,
    remindAt: serializeDate(row.remindAt) ?? new Date().toISOString(),
    status: row.status,
  };
}

function toWaiting(row: typeof waitingItems.$inferSelect): WaitingItemRecord {
  return {
    id: row.id,
    userId: row.userId,
    lifeEventId: row.lifeEventId,
    title: row.title,
    description: row.description,
    waitingOn: row.waitingOn,
    expectedBy: serializeDay(row.expectedBy),
    followUpDate: serializeDay(row.followUpDate),
    status: row.status,
    createdAt: serializeDate(row.createdAt) ?? new Date().toISOString(),
    resolvedAt: serializeDate(row.resolvedAt),
  };
}

function toActivity(row: typeof activityLogs.$inferSelect): ActivityRecord {
  return {
    id: row.id,
    userId: row.userId,
    actor: row.actor as ActivityRecord["actor"],
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    description: row.description,
    createdAt: serializeDate(row.createdAt) ?? new Date().toISOString(),
  };
}

function toProposal(row: typeof agentProposals.$inferSelect): ProposalRecord {
  const state = typeof row.conversationContextJson.state === "string" ? row.conversationContextJson.state : row.status === "pending" ? "ready_for_review" : row.status;
  return {
    id: row.id,
    userId: row.userId,
    originalInput: row.originalInput,
    conversationContextJson: row.conversationContextJson,
    proposedPlanJson: agentProposalSchema.parse(row.proposedPlanJson),
    status: row.status,
    createdAt: serializeDate(row.createdAt) ?? new Date().toISOString(),
    reviewedAt: serializeDate(row.reviewedAt),
    state: state as ProposalRecord["state"],
    clarificationQuestion:
      typeof row.conversationContextJson.clarificationQuestion === "string"
        ? row.conversationContextJson.clarificationQuestion
        : undefined,
  };
}

function summarize(event: LifeEventRecord, eventTasks: TaskRecord[], eventWaiting: WaitingItemRecord[]): LifeEventSummary {
  const openTasks = eventTasks.filter((task) => task.status !== "completed").sort(byDueDate);
  return {
    ...event,
    totalTasks: eventTasks.length,
    completedTasks: eventTasks.filter((task) => task.status === "completed").length,
    nextTask: openTasks[0] ?? null,
    waitingCount: eventWaiting.filter((item) => item.status === "waiting").length,
  };
}

function byDueDate(a: TaskRecord, b: TaskRecord) {
  if (a.dueDate === b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

async function requireEvent(executor: Executor, userId: string, eventId: string) {
  const [event] = await executor
    .select()
    .from(lifeEvents)
    .where(and(eq(lifeEvents.id, eventId), eq(lifeEvents.userId, userId)))
    .limit(1);
  if (!event) throw new Error("Life event not found.");
  return event;
}

async function requireTask(executor: Executor, userId: string, taskId: string) {
  const [task] = await executor
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1);
  if (!task) throw new Error("Task not found.");
  return task;
}

async function requireWaitingItem(executor: Executor, userId: string, waitingId: string) {
  const [item] = await executor
    .select()
    .from(waitingItems)
    .where(and(eq(waitingItems.id, waitingId), eq(waitingItems.userId, userId)))
    .limit(1);
  if (!item) throw new Error("Waiting item not found.");
  return item;
}

async function requireReminder(executor: Executor, userId: string, reminderId: string) {
  const [reminder] = await executor
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1);
  if (!reminder) throw new Error("Reminder not found.");
  return reminder;
}

async function log(
  executor: Executor,
  userId: string,
  actor: ActivityRecord["actor"],
  action: typeof activityLogs.$inferInsert.action,
  entityType: string,
  entityId: string,
  description: string,
) {
  await executor.insert(activityLogs).values({
    userId,
    actor,
    action,
    entityType,
    entityId,
    description,
  });
}

export class DrizzleDataRepository implements DataRepository {
  async getProfile(userId: string) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return {
      name: profile?.name ?? "Sonae User",
      timezone: profile?.timezone ?? "America/Toronto",
      reminderPreference: profile?.reminderPreference ?? "Morning digest",
    };
  }

  async updateProfile(userId: string, profile: DashboardData["profile"]) {
    const [existing] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (existing) {
      await db
        .update(profiles)
        .set({
          name: profile.name,
          timezone: profile.timezone,
          reminderPreference: profile.reminderPreference,
          onboardingCompleted: true,
          updatedAt: new Date(),
        })
        .where(and(eq(profiles.id, existing.id), eq(profiles.userId, userId)));
    } else {
      await db.insert(profiles).values({
        userId,
        name: profile.name,
        timezone: profile.timezone,
        reminderPreference: profile.reminderPreference,
        onboardingCompleted: true,
      });
    }
    await log(db, userId, "user", "updated", "profile", "profile", "Updated Sonae preferences.");
    return profile;
  }

  async getDashboardData(userId: string): Promise<DashboardData> {
    const [profile, allEvents, allTasks, allWaiting, proposals, activity] = await Promise.all([
      this.getProfile(userId),
      db.select().from(lifeEvents).where(eq(lifeEvents.userId, userId)).orderBy(desc(lifeEvents.createdAt)),
      db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.dueDate)),
      db.select().from(waitingItems).where(eq(waitingItems.userId, userId)).orderBy(asc(waitingItems.followUpDate)),
      db
        .select()
        .from(agentProposals)
        .where(and(eq(agentProposals.userId, userId), eq(agentProposals.status, "pending")))
        .orderBy(desc(agentProposals.createdAt)),
      db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt)).limit(25),
    ]);

    const day = todayISO();
    const taskRecords = allTasks.map(toTask);
    const waitingRecords = allWaiting.map(toWaiting);

    return {
      profile,
      today: taskRecords.filter((task) => task.dueDate === day && task.status !== "completed").sort(byDueDate),
      upcoming: taskRecords.filter((task) => task.status !== "completed" && task.dueDate !== day).sort(byDueDate),
      waiting: waitingRecords.filter((item) => item.status === "waiting"),
      lifeEvents: allEvents
        .map(toEvent)
        .filter((event) => event.status === "active")
        .map((event) =>
          summarize(
            event,
            taskRecords.filter((task) => task.lifeEventId === event.id),
            waitingRecords.filter((item) => item.lifeEventId === event.id),
          ),
        ),
      proposals: proposals.map(toProposal),
      recentlyCompleted: taskRecords.filter((task) => task.status === "completed"),
      activity: activity.map(toActivity),
    };
  }

  async listLifeEvents(userId: string) {
    const [eventRows, taskRows, waitingRows] = await Promise.all([
      db.select().from(lifeEvents).where(eq(lifeEvents.userId, userId)).orderBy(desc(lifeEvents.createdAt)),
      db.select().from(tasks).where(eq(tasks.userId, userId)),
      db.select().from(waitingItems).where(eq(waitingItems.userId, userId)),
    ]);
    const taskRecords = taskRows.map(toTask);
    const waitingRecords = waitingRows.map(toWaiting);
    return eventRows
      .map(toEvent)
      .map((event) =>
        summarize(
          event,
          taskRecords.filter((task) => task.lifeEventId === event.id),
          waitingRecords.filter((item) => item.lifeEventId === event.id),
        ),
      );
  }

  async getLifeEvent(userId: string, eventId: string) {
    const [eventRow] = await db
      .select()
      .from(lifeEvents)
      .where(and(eq(lifeEvents.id, eventId), eq(lifeEvents.userId, userId)))
      .limit(1);
    if (!eventRow) return null;

    const [taskRows, reminderRows, waitingRows] = await Promise.all([
      db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.lifeEventId, eventId))).orderBy(asc(tasks.dueDate)),
      db.select().from(reminders).where(and(eq(reminders.userId, userId), eq(reminders.lifeEventId, eventId))).orderBy(asc(reminders.remindAt)),
      db.select().from(waitingItems).where(and(eq(waitingItems.userId, userId), eq(waitingItems.lifeEventId, eventId))).orderBy(asc(waitingItems.followUpDate)),
    ]);

    const ids = [eventId, ...taskRows.map((task) => task.id), ...reminderRows.map((reminder) => reminder.id), ...waitingRows.map((item) => item.id)];
    const activityRows = ids.length
      ? await db
          .select()
          .from(activityLogs)
          .where(and(eq(activityLogs.userId, userId), inArray(activityLogs.entityId, ids)))
          .orderBy(desc(activityLogs.createdAt))
      : [];

    return {
      ...toEvent(eventRow),
      tasks: taskRows.map(toTask),
      reminders: reminderRows.map(toReminder),
      waiting: waitingRows.map(toWaiting),
      activity: activityRows.map(toActivity),
    };
  }

  async createLifeEvent(userId: string, input: CreateLifeEventInput) {
    const [event] = await db
      .insert(lifeEvents)
      .values({ userId, ...input })
      .returning({ id: lifeEvents.id });
    await log(db, userId, "user", "created", "life_event", event.id, `Created "${input.title}".`);
    return event.id;
  }

  async updateLifeEvent(userId: string, eventId: string, input: Partial<CreateLifeEventInput>) {
    await requireEvent(db, userId, eventId);
    const [event] = await db
      .update(lifeEvents)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(lifeEvents.id, eventId), eq(lifeEvents.userId, userId)))
      .returning();
    await log(db, userId, "user", "updated", "life_event", event.id, `Updated "${event.title}".`);
    return summarize(toEvent(event), [], []);
  }

  async completeLifeEvent(userId: string, eventId: string) {
    const event = await requireEvent(db, userId, eventId);
    await db
      .update(lifeEvents)
      .set({ status: "completed", updatedAt: new Date() })
      .where(and(eq(lifeEvents.id, eventId), eq(lifeEvents.userId, userId)));
    await log(db, userId, "user", "completed", "life_event", eventId, `Completed "${event.title}".`);
  }

  async deleteLifeEvent(userId: string, eventId: string) {
    await db.transaction(async (tx) => {
      await requireEvent(tx, userId, eventId);
      await tx.delete(lifeEvents).where(and(eq(lifeEvents.id, eventId), eq(lifeEvents.userId, userId)));
    });
  }

  async listTasks(userId: string) {
    const rows = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.dueDate));
    return rows.map(toTask);
  }

  async createTask(userId: string, input: CreateTaskInput) {
    if (input.lifeEventId) await requireEvent(db, userId, input.lifeEventId);
    const [task] = await db
      .insert(tasks)
      .values({ userId, ...input })
      .returning();
    await log(db, userId, input.source === "agent" ? "agent" : "user", "created", "task", task.id, `Created task "${task.title}".`);
    return toTask(task);
  }

  async updateTask(userId: string, taskId: string, input: Partial<CreateTaskInput>) {
    await requireTask(db, userId, taskId);
    if (input.lifeEventId) await requireEvent(db, userId, input.lifeEventId);
    const [task] = await db
      .update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    await log(db, userId, "user", "updated", "task", task.id, `Updated "${task.title}".`);
    return toTask(task);
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await requireTask(db, userId, taskId);
    await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    await log(db, userId, "user", "archived", "task", task.id, `Deleted "${task.title}".`);
  }

  async setTaskCompleted(userId: string, taskId: string, completed: boolean) {
    const current = await requireTask(db, userId, taskId);
    const [task] = await db
      .update(tasks)
      .set({
        status: completed ? "completed" : "pending",
        completedAt: completed ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    await log(db, userId, "user", completed ? "completed" : "updated", "task", task.id, `${completed ? "Completed" : "Reopened"} "${current.title}".`);
    return toTask(task);
  }

  async listWaitingItems(userId: string) {
    const rows = await db.select().from(waitingItems).where(eq(waitingItems.userId, userId)).orderBy(asc(waitingItems.followUpDate));
    return rows.map(toWaiting);
  }

  async createWaitingItem(userId: string, input: CreateWaitingItemInput) {
    if (input.lifeEventId) await requireEvent(db, userId, input.lifeEventId);
    const [item] = await db
      .insert(waitingItems)
      .values({ userId, ...input })
      .returning();
    await log(db, userId, "user", "created", "waiting_item", item.id, `Created waiting item "${item.title}".`);
    return toWaiting(item);
  }

  async updateWaitingItem(userId: string, waitingId: string, input: Partial<CreateWaitingItemInput>) {
    await requireWaitingItem(db, userId, waitingId);
    if (input.lifeEventId) await requireEvent(db, userId, input.lifeEventId);
    const [item] = await db
      .update(waitingItems)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(waitingItems.id, waitingId), eq(waitingItems.userId, userId)))
      .returning();
    await log(db, userId, "user", "updated", "waiting_item", item.id, `Updated "${item.title}".`);
    return toWaiting(item);
  }

  async deleteWaitingItem(userId: string, waitingId: string) {
    const item = await requireWaitingItem(db, userId, waitingId);
    await db.delete(waitingItems).where(and(eq(waitingItems.id, waitingId), eq(waitingItems.userId, userId)));
    await log(db, userId, "user", "archived", "waiting_item", item.id, `Deleted "${item.title}".`);
  }

  async resolveWaitingItem(userId: string, waitingId: string) {
    await requireWaitingItem(db, userId, waitingId);

    const [item] = await db
      .update(waitingItems)
      .set({ status: "resolved", resolvedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(waitingItems.id, waitingId), eq(waitingItems.userId, userId)))
      .returning();
    await log(db, userId, "user", "completed", "waiting_item", item.id, `Resolved "${item.title}".`);
    return toWaiting(item);
  }

  async createReminder(userId: string, input: CreateReminderInput) {
    if (input.lifeEventId) await requireEvent(db, userId, input.lifeEventId);
    if (input.taskId) await requireTask(db, userId, input.taskId);
    const [reminder] = await db
      .insert(reminders)
      .values({ userId, ...input, remindAt: new Date(input.remindAt) })
      .returning();
    await log(db, userId, "user", "created", "reminder", reminder.id, `Created reminder "${reminder.title}".`);
    return toReminder(reminder);
  }

  async updateReminder(userId: string, reminderId: string, input: Partial<CreateReminderInput>) {
    await requireReminder(db, userId, reminderId);
    if (input.lifeEventId) await requireEvent(db, userId, input.lifeEventId);
    if (input.taskId) await requireTask(db, userId, input.taskId);
    const { remindAt, ...rest } = input;
    const values = {
      ...rest,
      ...(remindAt ? { remindAt: new Date(remindAt) } : {}),
      updatedAt: new Date(),
    };
    const [reminder] = await db
      .update(reminders)
      .set(values)
      .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
      .returning();
    await log(db, userId, "user", "updated", "reminder", reminder.id, `Updated "${reminder.title}".`);
    return toReminder(reminder);
  }

  async deleteReminder(userId: string, reminderId: string) {
    const reminder = await requireReminder(db, userId, reminderId);
    await db.delete(reminders).where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)));
    await log(db, userId, "user", "archived", "reminder", reminder.id, `Deleted "${reminder.title}".`);
  }

  async listProposals(userId: string) {
    const rows = await db.select().from(agentProposals).where(eq(agentProposals.userId, userId)).orderBy(desc(agentProposals.createdAt));
    return rows.map(toProposal);
  }

  async getProposal(userId: string, proposalId: string) {
    const [proposal] = await db
      .select()
      .from(agentProposals)
      .where(and(eq(agentProposals.id, proposalId), eq(agentProposals.userId, userId)))
      .limit(1);
    return proposal ? toProposal(proposal) : null;
  }

  async createProposal(
    userId: string,
    input: {
      originalInput: string;
      proposal: AgentProposal;
      conversationContextJson?: Record<string, unknown>;
      clarificationQuestion?: string;
    },
  ) {
    const continuationId = typeof input.conversationContextJson?.proposalId === "string" ? input.conversationContextJson.proposalId : null;
    const context = {
      ...(input.conversationContextJson ?? {}),
      ...(input.clarificationQuestion ? { clarificationQuestion: input.clarificationQuestion } : {}),
    };

    if (continuationId) {
      const [existing] = await db
        .select()
        .from(agentProposals)
        .where(and(eq(agentProposals.id, continuationId), eq(agentProposals.userId, userId)))
        .limit(1);
      if (existing) {
        if (existing.status !== "pending") throw new Error("This proposal has already been reviewed.");
        const [proposal] = await db
          .update(agentProposals)
          .set({ proposedPlanJson: input.proposal, conversationContextJson: context })
          .where(and(eq(agentProposals.id, existing.id), eq(agentProposals.userId, userId)))
          .returning();
        await log(db, userId, "agent", "updated", "agent_proposal", proposal.id, input.clarificationQuestion ? "Agent updated the clarification request." : "Agent completed the clarified plan.");
        return toProposal(proposal);
      }
    }

    const [proposal] = await db
      .insert(agentProposals)
      .values({
        userId,
        originalInput: input.originalInput,
        conversationContextJson: context,
        proposedPlanJson: input.proposal,
        expiresAt: addDays(new Date(), 14),
      })
      .returning();
    await log(db, userId, "agent", "created", "agent_proposal", proposal.id, input.clarificationQuestion ? "Agent requested clarification." : "Agent created a plan suggestion.");
    return toProposal(proposal);
  }

  async approveProposal(userId: string, proposalId: string, editedProposal: AgentProposal) {
    return db.transaction(async (tx) => {
      const [proposal] = await tx
        .select()
        .from(agentProposals)
        .where(and(eq(agentProposals.id, proposalId), eq(agentProposals.userId, userId)))
        .limit(1);
      if (!proposal) throw new Error("Proposal not found.");
      if (proposal.status !== "pending") throw new Error("This proposal has already been reviewed.");
      if (proposal.conversationContextJson.state === "awaiting_clarification") {
        throw new Error("This proposal still needs clarification before approval.");
      }

      const parsed = agentProposalSchema.parse(editedProposal);
      if (parsed.clarificationQuestions.length) throw new Error("This proposal still needs clarification before approval.");
      const [event] = await tx
        .insert(lifeEvents)
        .values({
          userId,
          title: parsed.lifeEvent.title,
          description: parsed.lifeEvent.description,
          category: parsed.lifeEvent.category,
          startDate: parsed.lifeEvent.startDate ?? null,
          endDate: parsed.lifeEvent.endDate ?? null,
        })
        .returning({ id: lifeEvents.id });

      if (parsed.tasks.length) {
        const taskRows = await tx.insert(tasks).values(
          parsed.tasks.map((task) => ({
            userId,
            lifeEventId: event.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate ?? null,
            source: "agent",
          })),
        ).returning({ id: tasks.id, title: tasks.title });
        await Promise.all(taskRows.map((task) => log(tx, userId, "agent", "created", "task", task.id, `Created task "${task.title}".`)));
      }

      if (parsed.reminders.length) {
        const reminderRows = await tx.insert(reminders).values(
          parsed.reminders.map((reminder) => ({
            userId,
            taskId: null,
            lifeEventId: event.id,
            title: reminder.title,
            remindAt: new Date(reminder.remindAt),
          })),
        ).returning({ id: reminders.id, title: reminders.title });
        await Promise.all(reminderRows.map((reminder) => log(tx, userId, "agent", "created", "reminder", reminder.id, `Created reminder "${reminder.title}".`)));
      }

      if (parsed.waitingItems.length) {
        const waitingRows = await tx.insert(waitingItems).values(
          parsed.waitingItems.map((item) => ({
            userId,
            lifeEventId: event.id,
            title: item.title,
            description: item.description,
            waitingOn: item.waitingOn,
            expectedBy: item.expectedBy ?? null,
            followUpDate: item.followUpDate ?? null,
          })),
        ).returning({ id: waitingItems.id, title: waitingItems.title });
        await Promise.all(waitingRows.map((item) => log(tx, userId, "agent", "created", "waiting_item", item.id, `Created waiting item "${item.title}".`)));
      }

      await tx
        .update(agentProposals)
        .set({ status: "approved", reviewedAt: new Date(), proposedPlanJson: parsed, conversationContextJson: { ...proposal.conversationContextJson, state: "approved" } })
        .where(and(eq(agentProposals.id, proposalId), eq(agentProposals.userId, userId), eq(agentProposals.status, "pending")));

      await log(tx, userId, "user", "approved", "agent_proposal", proposal.id, `Approved "${parsed.lifeEvent.title}".`);
      await log(tx, userId, "agent", "created", "life_event", event.id, `Created "${parsed.lifeEvent.title}" from an approved plan.`);
      return event.id;
    });
  }

  async rejectProposal(userId: string, proposalId: string) {
    const [current] = await db
      .select()
      .from(agentProposals)
      .where(and(eq(agentProposals.id, proposalId), eq(agentProposals.userId, userId)))
      .limit(1);
    if (!current) throw new Error("Proposal not found.");
    if (current.status !== "pending") throw new Error("This proposal has already been reviewed.");

    const [proposal] = await db
      .update(agentProposals)
      .set({ status: "rejected", reviewedAt: new Date(), conversationContextJson: { ...current.conversationContextJson, state: "rejected" } })
      .where(and(eq(agentProposals.id, proposalId), eq(agentProposals.userId, userId), eq(agentProposals.status, "pending")))
      .returning();
    await log(db, userId, "user", "rejected", "agent_proposal", proposal.id, "Rejected an agent proposal.");
  }

  async recordAgentRun(userId: string, run: Omit<AgentRunRecord, "id" | "userId" | "startedAt">) {
    const [record] = await db
      .insert(agentRuns)
      .values({
        userId,
        proposalId: run.proposalId,
        input: run.input,
      provider: run.provider,
      model: run.model,
      promptVersion: run.promptVersion ?? "sonae-v1",
      status: run.status,
      stepCount: run.stepCount,
      toolCallsJson: run.toolCallsJson,
      progressEventsJson: run.progressEventsJson ?? [],
      usageJson: run.usageJson ?? null,
      errorCategory: run.errorCategory ?? null,
      errorMessage: run.errorMessage,
        completedAt: run.completedAt ? new Date(run.completedAt) : null,
      })
      .returning();
    return {
      id: record.id,
      userId: record.userId,
      proposalId: record.proposalId,
      input: record.input,
      provider: record.provider as AgentRunRecord["provider"],
      model: record.model,
      promptVersion: record.promptVersion,
      status: record.status as AgentRunRecord["status"],
      stepCount: record.stepCount,
      toolCallsJson: record.toolCallsJson,
      progressEventsJson: record.progressEventsJson,
      usageJson: record.usageJson,
      errorCategory: record.errorCategory,
      errorMessage: record.errorMessage,
      startedAt: serializeDate(record.startedAt) ?? new Date().toISOString(),
      completedAt: serializeDate(record.completedAt),
    };
  }
}
