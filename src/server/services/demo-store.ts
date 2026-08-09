import type {
  ActivityRecord,
  DashboardData,
  LifeEventRecord,
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

export function getDemoDashboard(): DashboardData {
  return {
    profile: store.profile,
    today: store.tasks.filter((task) => task.dueDate === today && task.status !== "completed"),
    upcoming: store.tasks.filter((task) => task.status !== "completed" && task.dueDate !== today),
    waiting: store.waiting.filter((item) => item.status === "waiting"),
    lifeEvents: store.events.filter((event) => event.status === "active"),
    proposals: store.proposals.filter((proposal) => proposal.status === "pending"),
    recentlyCompleted: store.tasks.filter((task) => task.status === "completed"),
    activity: store.activity,
  };
}

export function getDemoProposal(proposalId: string) {
  return store.proposals.find((proposal) => proposal.id === proposalId) ?? null;
}

export function listDemoProposals() {
  return store.proposals;
}

export function listDemoEvents() {
  return store.events;
}

export function getDemoEvent(eventId: string) {
  return store.events.find((event) => event.id === eventId) ?? null;
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
