import { addDays } from "date-fns";

import type {
  ActivityRecord,
  DashboardData,
  LifeEventDetail,
  LifeEventRecord,
  LifeEventSummary,
  ProposalRecord,
  ReminderRecord,
  TaskRecord,
  WaitingItemRecord,
} from "@/server/services/types";
import type { AgentProposal } from "@/lib/validations/proposal";
import { todayISO } from "@/lib/dates";

type Store = {
  profile: DashboardData["profile"];
  events: LifeEventRecord[];
  tasks: TaskRecord[];
  waiting: WaitingItemRecord[];
  reminders: ReminderRecord[];
  proposals: ProposalRecord[];
  activity: ActivityRecord[];
};

const now = new Date();
const today = todayISO(now);

declare global {
  var __lifeAdminDemoStore: Store | undefined;
}

function createInitialStore(): Store {
  return {
  profile: {
    name: "Faiz",
    timezone: "America/Toronto",
    reminderPreference: "Morning digest",
  },
  events: [
    {
      id: "event-moving",
      title: "Moving to a New House",
      description: "A calm plan for address changes, services, packing, and move-day handoffs.",
      category: "moving",
      status: "active",
      startDate: today,
      endDate: "2026-09-01",
    },
    {
      id: "event-trip",
      title: "New York Trip",
      description: "Travel prep, documents, and bookings for the August trip.",
      category: "travel",
      status: "active",
      startDate: "2026-08-16",
      endDate: "2026-08-20",
    },
    {
      id: "event-return",
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
      action: "created",
      entityType: "life_event",
      entityId: "event-moving",
      description: "Agent proposal approved for Moving to a New House.",
      createdAt: new Date().toISOString(),
    },
  ],
  };
}

const store: Store = globalThis.__lifeAdminDemoStore ?? createInitialStore();
globalThis.__lifeAdminDemoStore = store;

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Earliest due date first; undated tasks sink to the bottom of the list. */
function byDueDate(a: TaskRecord, b: TaskRecord) {
  if (a.dueDate === b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

function summarizeEvent(event: LifeEventRecord): LifeEventSummary {
  const tasks = store.tasks.filter((task) => task.lifeEventId === event.id);
  const open = tasks.filter((task) => task.status !== "completed").sort(byDueDate);

  return {
    ...event,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === "completed").length,
    nextTask: open[0] ?? null,
    waitingCount: store.waiting.filter(
      (item) => item.lifeEventId === event.id && item.status === "waiting",
    ).length,
  };
}

export function getDemoDashboard(): DashboardData {
  return {
    profile: store.profile,
    today: store.tasks
      .filter((task) => task.dueDate === today && task.status !== "completed")
      .sort(byDueDate),
    upcoming: store.tasks
      .filter((task) => task.status !== "completed" && task.dueDate !== today)
      .sort(byDueDate),
    waiting: store.waiting.filter((item) => item.status === "waiting"),
    lifeEvents: store.events.filter((event) => event.status === "active").map(summarizeEvent),
    proposals: store.proposals.filter((proposal) => proposal.status === "pending"),
    recentlyCompleted: store.tasks.filter((task) => task.status === "completed"),
    activity: store.activity,
  };
}

export function listDemoWaiting() {
  return store.waiting;
}

export function listDemoTasks() {
  return [...store.tasks].sort(byDueDate);
}

export function updateDemoProfile(profile: DashboardData["profile"]) {
  store.profile = profile;
  store.activity.unshift({
    id: id("activity"),
    action: "updated",
    entityType: "profile",
    entityId: "profile",
    description: "Updated Life Admin preferences.",
    createdAt: new Date().toISOString(),
  });
  return store.profile;
}

export function resolveDemoWaitingItem(waitingId: string) {
  const item = store.waiting.find((entry) => entry.id === waitingId);
  if (!item) throw new Error("Waiting item not found.");
  if (item.status === "resolved") return item;

  item.status = "resolved";
  item.resolvedAt = new Date().toISOString();
  store.activity.unshift({
    id: id("activity"),
    action: "completed",
    entityType: "waiting_item",
    entityId: item.id,
    description: `Resolved “${item.title}”.`,
    createdAt: new Date().toISOString(),
  });
  return item;
}

export function getDemoProposal(proposalId: string) {
  return store.proposals.find((proposal) => proposal.id === proposalId) ?? null;
}

export function listDemoProposals() {
  return store.proposals;
}

export function listDemoEvents(): LifeEventSummary[] {
  return store.events.map(summarizeEvent);
}

export function getDemoEvent(eventId: string): LifeEventDetail | null {
  const event = store.events.find((entry) => entry.id === eventId);
  if (!event) return null;

  return {
    ...event,
    tasks: store.tasks.filter((task) => task.lifeEventId === eventId).sort(byDueDate),
    reminders: store.reminders.filter((reminder) => reminder.lifeEventId === eventId),
    waiting: store.waiting.filter((item) => item.lifeEventId === eventId),
    activity: store.activity.filter((entry) => relatedIds(eventId).has(entry.entityId)),
  };
}

/** The event plus everything hanging off it, so its history reads completely. */
function relatedIds(eventId: string) {
  const ids = new Set<string>([eventId]);
  store.tasks.forEach((task) => task.lifeEventId === eventId && ids.add(task.id));
  store.waiting.forEach((item) => item.lifeEventId === eventId && ids.add(item.id));
  return ids;
}

export function createDemoProposal(originalInput: string, proposedPlanJson: AgentProposal, clarificationQuestion?: string) {
  const proposal: ProposalRecord = {
    id: id("proposal"),
    originalInput,
    proposedPlanJson,
    status: "pending",
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    clarificationQuestion,
  };
  store.proposals.unshift(proposal);
  store.activity.unshift({
    id: id("activity"),
    action: "created",
    entityType: "agent_proposal",
    entityId: proposal.id,
    description: clarificationQuestion ? "Agent requested clarification." : "Agent created a plan suggestion.",
    createdAt: new Date().toISOString(),
  });
  return proposal;
}

export function approveDemoProposal(proposalId: string, editedProposal: AgentProposal) {
  const proposal = getDemoProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found.");
  if (proposal.status !== "pending") throw new Error("This proposal has already been reviewed.");

  const eventId = id("event");
  store.events.unshift({
    id: eventId,
    title: editedProposal.lifeEvent.title,
    description: editedProposal.lifeEvent.description,
    category: editedProposal.lifeEvent.category,
    status: "active",
    startDate: editedProposal.lifeEvent.startDate ?? null,
    endDate: editedProposal.lifeEvent.endDate ?? null,
  });

  editedProposal.tasks.forEach((task) => {
    store.tasks.unshift({
      id: id("task"),
      lifeEventId: eventId,
      title: task.title,
      description: task.description,
      status: "pending",
      priority: task.priority,
      dueDate: task.dueDate ?? null,
      completedAt: null,
      source: "agent",
    });
  });

  editedProposal.waitingItems.forEach((item) => {
    store.waiting.unshift({
      id: id("waiting"),
      lifeEventId: eventId,
      title: item.title,
      description: item.description,
      waitingOn: item.waitingOn,
      expectedBy: item.expectedBy ?? null,
      followUpDate: item.followUpDate ?? null,
      status: "waiting",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    });
  });

  editedProposal.reminders.forEach((reminder) => {
    store.reminders.unshift({
      id: id("reminder"),
      taskId: null,
      lifeEventId: eventId,
      title: reminder.title,
      remindAt: reminder.remindAt,
      status: "scheduled",
    });
  });

  proposal.status = "approved";
  proposal.reviewedAt = new Date().toISOString();
  proposal.proposedPlanJson = editedProposal;
  store.activity.unshift({
    id: id("activity"),
    action: "approved",
    entityType: "agent_proposal",
    entityId: proposal.id,
    description: `Approved “${editedProposal.lifeEvent.title}” and saved its tasks.`,
    createdAt: new Date().toISOString(),
  });
  store.activity.unshift({
    id: id("activity"),
    action: "created",
    entityType: "life_event",
    entityId: eventId,
    description: `Created “${editedProposal.lifeEvent.title}” from an approved plan.`,
    createdAt: new Date().toISOString(),
  });

  return eventId;
}

export function rejectDemoProposal(proposalId: string) {
  const proposal = getDemoProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found.");
  if (proposal.status !== "pending") throw new Error("This proposal has already been reviewed.");
  proposal.status = "rejected";
  proposal.reviewedAt = new Date().toISOString();
  store.activity.unshift({
    id: id("activity"),
    action: "rejected",
    entityType: "agent_proposal",
    entityId: proposal.id,
    description: "Rejected an agent proposal.",
    createdAt: new Date().toISOString(),
  });
}

export function completeDemoTask(taskId: string, completed: boolean) {
  const task = store.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found.");
  task.status = completed ? "completed" : "pending";
  task.completedAt = completed ? new Date().toISOString() : null;
  store.activity.unshift({
    id: id("activity"),
    action: completed ? "completed" : "updated",
    entityType: "task",
    entityId: task.id,
    description: `${completed ? "Completed" : "Reopened"} “${task.title}”.`,
    createdAt: new Date().toISOString(),
  });
  return task;
}
