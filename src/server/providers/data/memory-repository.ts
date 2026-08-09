import "server-only";

import { addDays } from "date-fns";
import { agentProposalSchema, type AgentProposal } from "@/lib/validations/proposal";
import { todayISO } from "@/lib/dates";
import { DEMO_USER_ID } from "@/server/providers/auth/demo-auth";
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
  LifeEventDetail,
  LifeEventRecord,
  LifeEventSummary,
  ProposalRecord,
  ReminderRecord,
  TaskRecord,
  WaitingItemRecord,
} from "@/server/services/types";

type Store = {
  profiles: Record<string, DashboardData["profile"]>;
  events: LifeEventRecord[];
  tasks: TaskRecord[];
  waiting: WaitingItemRecord[];
  reminders: ReminderRecord[];
  proposals: ProposalRecord[];
  activity: ActivityRecord[];
  agentRuns: AgentRunRecord[];
};

declare global {
  var __lifeAdminMemoryStore: Store | undefined;
}

const now = new Date();
const today = todayISO(now);

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createInitialStore(): Store {
  return {
    profiles: {
      [DEMO_USER_ID]: {
        name: "Demo User",
        timezone: "America/Toronto",
        reminderPreference: "Morning digest",
      },
    },
    events: [
      {
        id: "event-moving",
        userId: DEMO_USER_ID,
        title: "Moving to a New House",
        description: "A calm plan for address changes, services, packing, and move-day handoffs.",
        category: "moving",
        status: "active",
        startDate: today,
        endDate: "2026-09-01",
      },
      {
        id: "event-trip",
        userId: DEMO_USER_ID,
        title: "New York Trip",
        description: "Travel prep, documents, and bookings for the August trip.",
        category: "travel",
        status: "active",
        startDate: "2026-08-16",
        endDate: "2026-08-20",
      },
      {
        id: "event-return",
        userId: DEMO_USER_ID,
        title: "Headphones Return Window",
        description: "Test the purchase and decide before the return deadline.",
        category: "purchase",
        status: "active",
        startDate: today,
        endDate: "2026-09-07",
      },
    ],
    tasks: [
      {
        id: "task-package",
        userId: DEMO_USER_ID,
        lifeEventId: "event-return",
        title: "Return Amazon package",
        description: "Drop off the package before the return window closes.",
        status: "pending",
        priority: "high",
        dueDate: today,
        completedAt: null,
        source: "agent",
      },
      {
        id: "task-landlord",
        userId: DEMO_USER_ID,
        lifeEventId: null,
        title: "Follow up with landlord",
        description: "Ask for the lease addendum and move-in details.",
        status: "pending",
        priority: "medium",
        dueDate: today,
        completedAt: null,
        source: "user",
      },
      {
        id: "task-passport",
        userId: DEMO_USER_ID,
        lifeEventId: null,
        title: "Review passport renewal timeline",
        description: "Check renewal requirements before booking travel.",
        status: "pending",
        priority: "medium",
        dueDate: "2026-09-15",
        completedAt: null,
        source: "agent",
      },
      {
        id: "task-addresses",
        userId: DEMO_USER_ID,
        lifeEventId: "event-moving",
        title: "Update delivery addresses",
        description: "Change saved addresses for frequently used services.",
        status: "completed",
        priority: "low",
        dueDate: "2026-08-07",
        completedAt: new Date().toISOString(),
        source: "agent",
      },
    ],
    waiting: [
      {
        id: "waiting-refund",
        userId: DEMO_USER_ID,
        lifeEventId: null,
        title: "Airline refund",
        description: "Refund request submitted through support portal.",
        waitingOn: "Airline support",
        expectedBy: "2026-08-21",
        followUpDate: "2026-08-14",
        status: "waiting",
        createdAt: addDays(now, -3).toISOString(),
        resolvedAt: null,
      },
      {
        id: "waiting-recruiter",
        userId: DEMO_USER_ID,
        lifeEventId: null,
        title: "Recruiter response",
        description: "Follow up if there is no reply after the promised update.",
        waitingOn: "Recruiter",
        expectedBy: null,
        followUpDate: "2026-08-12",
        status: "waiting",
        createdAt: addDays(now, -9).toISOString(),
        resolvedAt: null,
      },
    ],
    reminders: [],
    proposals: [],
    activity: [
      {
        id: "activity-seed-1",
        userId: DEMO_USER_ID,
        actor: "agent",
        action: "created",
        entityType: "life_event",
        entityId: "event-moving",
        description: "Agent proposal approved for Moving to a New House.",
        createdAt: new Date().toISOString(),
      },
    ],
    agentRuns: [],
  };
}

const store = globalThis.__lifeAdminMemoryStore ?? createInitialStore();
globalThis.__lifeAdminMemoryStore = store;

function byDueDate(a: TaskRecord, b: TaskRecord) {
  if (a.dueDate === b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

function assertOwns<T extends { userId?: string }>(record: T | undefined | null, userId: string, label: string): T {
  if (!record || record.userId !== userId) throw new Error(`${label} not found.`);
  return record;
}

function log(userId: string, actor: ActivityRecord["actor"], action: string, entityType: string, entityId: string, description: string) {
  store.activity.unshift({
    id: id("activity"),
    userId,
    actor,
    action,
    entityType,
    entityId,
    description,
    createdAt: new Date().toISOString(),
  });
}

function summarizeEvent(event: LifeEventRecord): LifeEventSummary {
  const tasks = store.tasks.filter((task) => task.userId === event.userId && task.lifeEventId === event.id);
  const open = tasks.filter((task) => task.status !== "completed").sort(byDueDate);
  return {
    ...event,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === "completed").length,
    nextTask: open[0] ?? null,
    waitingCount: store.waiting.filter((item) => item.userId === event.userId && item.lifeEventId === event.id && item.status === "waiting").length,
  };
}

function relatedIds(userId: string, eventId: string) {
  const ids = new Set<string>([eventId]);
  store.tasks.forEach((task) => task.userId === userId && task.lifeEventId === eventId && ids.add(task.id));
  store.waiting.forEach((item) => item.userId === userId && item.lifeEventId === eventId && ids.add(item.id));
  store.reminders.forEach((reminder) => reminder.userId === userId && reminder.lifeEventId === eventId && ids.add(reminder.id));
  return ids;
}

export class MemoryDataRepository implements DataRepository {
  async getProfile(userId: string) {
    return store.profiles[userId] ?? {
      name: "Demo User",
      timezone: "America/Toronto",
      reminderPreference: "Morning digest",
    };
  }

  async updateProfile(userId: string, profile: DashboardData["profile"]) {
    store.profiles[userId] = profile;
    log(userId, "user", "updated", "profile", "profile", "Updated Sonae preferences.");
    return profile;
  }

  async getDashboardData(userId: string): Promise<DashboardData> {
    return {
      profile: await this.getProfile(userId),
      today: store.tasks.filter((task) => task.userId === userId && task.dueDate === today && task.status !== "completed").sort(byDueDate),
      upcoming: store.tasks.filter((task) => task.userId === userId && task.status !== "completed" && task.dueDate !== today).sort(byDueDate),
      waiting: store.waiting.filter((item) => item.userId === userId && item.status === "waiting"),
      lifeEvents: store.events.filter((event) => event.userId === userId && event.status === "active").map(summarizeEvent),
      proposals: store.proposals.filter((proposal) => proposal.userId === userId && proposal.status === "pending"),
      recentlyCompleted: store.tasks.filter((task) => task.userId === userId && task.status === "completed"),
      activity: store.activity.filter((entry) => entry.userId === userId),
    };
  }

  async listLifeEvents(userId: string) {
    return store.events.filter((event) => event.userId === userId).map(summarizeEvent);
  }

  async getLifeEvent(userId: string, eventId: string): Promise<LifeEventDetail | null> {
    const event = store.events.find((entry) => entry.id === eventId && entry.userId === userId);
    if (!event) return null;
    const ids = relatedIds(userId, eventId);
    return {
      ...event,
      tasks: store.tasks.filter((task) => task.userId === userId && task.lifeEventId === eventId).sort(byDueDate),
      reminders: store.reminders.filter((reminder) => reminder.userId === userId && reminder.lifeEventId === eventId),
      waiting: store.waiting.filter((item) => item.userId === userId && item.lifeEventId === eventId),
      activity: store.activity.filter((entry) => entry.userId === userId && ids.has(entry.entityId)),
    };
  }

  async createLifeEvent(userId: string, input: CreateLifeEventInput) {
    const eventId = id("event");
    store.events.unshift({ id: eventId, userId, status: "active", ...input });
    log(userId, "user", "created", "life_event", eventId, `Created “${input.title}”.`);
    return eventId;
  }

  async updateLifeEvent(userId: string, eventId: string, input: Partial<CreateLifeEventInput>) {
    const event = assertOwns(store.events.find((entry) => entry.id === eventId), userId, "Life event");
    Object.assign(event, input);
    log(userId, "user", "updated", "life_event", event.id, `Updated “${event.title}”.`);
    return summarizeEvent(event);
  }

  async completeLifeEvent(userId: string, eventId: string) {
    const event = assertOwns(store.events.find((entry) => entry.id === eventId), userId, "Life event");
    event.status = "completed";
    log(userId, "user", "completed", "life_event", eventId, `Completed “${event.title}”.`);
  }

  async listTasks(userId: string) {
    return store.tasks.filter((task) => task.userId === userId).sort(byDueDate);
  }

  async createTask(userId: string, input: CreateTaskInput) {
    if (input.lifeEventId) assertOwns(store.events.find((event) => event.id === input.lifeEventId), userId, "Life event");
    const task: TaskRecord = {
      id: id("task"),
      userId,
      status: "pending",
      completedAt: null,
      source: input.source ?? "user",
      ...input,
    };
    store.tasks.unshift(task);
    log(userId, input.source === "agent" ? "agent" : "user", "created", "task", task.id, `Created task “${task.title}”.`);
    return task;
  }

  async updateTask(userId: string, taskId: string, input: Partial<CreateTaskInput>) {
    const task = assertOwns(store.tasks.find((entry) => entry.id === taskId), userId, "Task");
    Object.assign(task, input);
    log(userId, "user", "updated", "task", task.id, `Updated “${task.title}”.`);
    return task;
  }

  async setTaskCompleted(userId: string, taskId: string, completed: boolean) {
    const task = assertOwns(store.tasks.find((entry) => entry.id === taskId), userId, "Task");
    task.status = completed ? "completed" : "pending";
    task.completedAt = completed ? new Date().toISOString() : null;
    log(userId, "user", completed ? "completed" : "updated", "task", task.id, `${completed ? "Completed" : "Reopened"} “${task.title}”.`);
    return task;
  }

  async listWaitingItems(userId: string) {
    return store.waiting.filter((item) => item.userId === userId);
  }

  async createWaitingItem(userId: string, input: CreateWaitingItemInput) {
    if (input.lifeEventId) assertOwns(store.events.find((event) => event.id === input.lifeEventId), userId, "Life event");
    const item: WaitingItemRecord = {
      id: id("waiting"),
      userId,
      status: "waiting",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      ...input,
    };
    store.waiting.unshift(item);
    log(userId, "user", "created", "waiting_item", item.id, `Created waiting item “${item.title}”.`);
    return item;
  }

  async resolveWaitingItem(userId: string, waitingId: string) {
    const item = assertOwns(store.waiting.find((entry) => entry.id === waitingId), userId, "Waiting item");
    if (item.status !== "resolved") {
      item.status = "resolved";
      item.resolvedAt = new Date().toISOString();
      log(userId, "user", "completed", "waiting_item", item.id, `Resolved “${item.title}”.`);
    }
    return item;
  }

  async createReminder(userId: string, input: CreateReminderInput) {
    if (input.lifeEventId) assertOwns(store.events.find((event) => event.id === input.lifeEventId), userId, "Life event");
    if (input.taskId) assertOwns(store.tasks.find((task) => task.id === input.taskId), userId, "Task");
    const reminder: ReminderRecord = { id: id("reminder"), userId, status: "scheduled", ...input };
    store.reminders.unshift(reminder);
    log(userId, "user", "created", "reminder", reminder.id, `Created reminder “${reminder.title}”.`);
    return reminder;
  }

  async listProposals(userId: string) {
    return store.proposals.filter((proposal) => proposal.userId === userId);
  }

  async getProposal(userId: string, proposalId: string) {
    return store.proposals.find((proposal) => proposal.id === proposalId && proposal.userId === userId) ?? null;
  }

  async createProposal(userId: string, input: { originalInput: string; proposal: AgentProposal; conversationContextJson?: Record<string, unknown>; clarificationQuestion?: string }) {
    const continuationId = typeof input.conversationContextJson?.proposalId === "string" ? input.conversationContextJson.proposalId : null;
    const existing = continuationId
      ? store.proposals.find((proposal) => proposal.id === continuationId && proposal.userId === userId)
      : null;

    if (existing) {
      if (existing.status !== "pending") throw new Error("This proposal has already been reviewed.");
      existing.proposedPlanJson = input.proposal;
      existing.conversationContextJson = input.conversationContextJson ?? {};
      existing.clarificationQuestion = input.clarificationQuestion;
      existing.state = input.clarificationQuestion ? "awaiting_clarification" : "ready_for_review";
      log(userId, "agent", "updated", "agent_proposal", existing.id, input.clarificationQuestion ? "Agent updated the clarification request." : "Agent completed the clarified plan.");
      return existing;
    }

    const proposal: ProposalRecord = {
      id: id("proposal"),
      userId,
      originalInput: input.originalInput,
      conversationContextJson: input.conversationContextJson ?? {},
      proposedPlanJson: input.proposal,
      status: "pending",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      clarificationQuestion: input.clarificationQuestion,
      state: input.clarificationQuestion ? "awaiting_clarification" : "ready_for_review",
    };
    store.proposals.unshift(proposal);
    log(userId, "agent", "created", "agent_proposal", proposal.id, input.clarificationQuestion ? "Agent requested clarification." : "Agent created a plan suggestion.");
    return proposal;
  }

  async approveProposal(userId: string, proposalId: string, editedProposal: AgentProposal) {
    const proposal = assertOwns(store.proposals.find((entry) => entry.id === proposalId), userId, "Proposal");
    if (proposal.status !== "pending") throw new Error("This proposal has already been reviewed.");
    if (proposal.state === "awaiting_clarification" || proposal.proposedPlanJson.clarificationQuestions.length) {
      throw new Error("This proposal still needs clarification before approval.");
    }
    const parsed = agentProposalSchema.parse(editedProposal);

    const eventId = id("event");
    store.events.unshift({
      id: eventId,
      userId,
      title: parsed.lifeEvent.title,
      description: parsed.lifeEvent.description,
      category: parsed.lifeEvent.category,
      status: "active",
      startDate: parsed.lifeEvent.startDate ?? null,
      endDate: parsed.lifeEvent.endDate ?? null,
    });

    parsed.tasks.forEach((task) => {
      const taskRecord: TaskRecord = {
        id: id("task"),
        userId,
        lifeEventId: eventId,
        title: task.title,
        description: task.description,
        status: "pending",
        priority: task.priority,
        dueDate: task.dueDate ?? null,
        completedAt: null,
        source: "agent",
      };
      store.tasks.unshift(taskRecord);
      log(userId, "agent", "created", "task", taskRecord.id, `Created task “${task.title}”.`);
    });

    parsed.reminders.forEach((reminder) => {
      const reminderRecord: ReminderRecord = {
        id: id("reminder"),
        userId,
        taskId: null,
        lifeEventId: eventId,
        title: reminder.title,
        remindAt: reminder.remindAt,
        status: "scheduled",
      };
      store.reminders.unshift(reminderRecord);
      log(userId, "agent", "created", "reminder", reminderRecord.id, `Created reminder “${reminder.title}”.`);
    });

    parsed.waitingItems.forEach((item) => {
      const waitingRecord: WaitingItemRecord = {
        id: id("waiting"),
        userId,
        lifeEventId: eventId,
        title: item.title,
        description: item.description,
        waitingOn: item.waitingOn,
        expectedBy: item.expectedBy ?? null,
        followUpDate: item.followUpDate ?? null,
        status: "waiting",
        createdAt: new Date().toISOString(),
        resolvedAt: null,
      };
      store.waiting.unshift(waitingRecord);
      log(userId, "agent", "created", "waiting_item", waitingRecord.id, `Created waiting item “${item.title}”.`);
    });

    proposal.status = "approved";
    proposal.state = "approved";
    proposal.reviewedAt = new Date().toISOString();
    proposal.proposedPlanJson = parsed;
    log(userId, "user", "approved", "agent_proposal", proposal.id, `Approved “${parsed.lifeEvent.title}”.`);
    log(userId, "agent", "created", "life_event", eventId, `Created “${parsed.lifeEvent.title}” from an approved plan.`);
    return eventId;
  }

  async rejectProposal(userId: string, proposalId: string) {
    const proposal = assertOwns(store.proposals.find((entry) => entry.id === proposalId), userId, "Proposal");
    if (proposal.status !== "pending") throw new Error("This proposal has already been reviewed.");
    proposal.status = "rejected";
    proposal.state = "rejected";
    proposal.reviewedAt = new Date().toISOString();
    log(userId, "user", "rejected", "agent_proposal", proposal.id, "Rejected an agent proposal.");
  }

  async recordAgentRun(userId: string, run: Omit<AgentRunRecord, "id" | "userId" | "startedAt">) {
    const record: AgentRunRecord = {
      id: id("run"),
      userId,
      startedAt: new Date().toISOString(),
      ...run,
    };
    store.agentRuns.unshift(record);
    return record;
  }
}
