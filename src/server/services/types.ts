import type { AgentProposal } from "@/lib/validations/proposal";

export type LifeEventRecord = {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  status: "draft" | "active" | "completed" | "archived";
  startDate: string | null;
  endDate: string | null;
};

export type TaskRecord = {
  id: string;
  userId?: string;
  lifeEventId: string | null;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  completedAt: string | null;
  source: "user" | "agent" | string;
};

export type WaitingItemRecord = {
  id: string;
  userId?: string;
  lifeEventId: string | null;
  title: string;
  description: string;
  waitingOn: string;
  expectedBy: string | null;
  followUpDate: string | null;
  status: "waiting" | "follow_up_due" | "resolved" | "cancelled";
  /** Both columns already exist on `waiting_items`; the UI needs them to show
   *  how long something has been waiting. */
  createdAt: string;
  resolvedAt: string | null;
};

export type ReminderRecord = {
  id: string;
  userId?: string;
  taskId: string | null;
  lifeEventId: string | null;
  title: string;
  remindAt: string;
  status: "scheduled" | "sent" | "dismissed" | "cancelled";
  deliveryChannel: "email";
  deliveryStatus: "pending" | "scheduled" | "sending" | "sent" | "failed" | "skipped" | "cancelled";
  deliveryVersion: number;
  deliveryRecipientEmail: string | null;
  qstashMessageId: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  lastAttemptAt: string | null;
  failureCount: number;
  lastError: string | null;
};

export type ProposalRecord = {
  id: string;
  userId?: string;
  originalInput: string;
  conversationContextJson?: Record<string, unknown>;
  proposedPlanJson: AgentProposal;
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: string;
  reviewedAt: string | null;
  clarificationQuestion?: string;
  state?: "created" | "running" | "awaiting_clarification" | "ready_for_review" | "approved" | "rejected" | "failed" | "expired";
};

export type ActivityRecord = {
  id: string;
  userId?: string;
  actor: "user" | "agent" | "system";
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
};

export type AgentRunRecord = {
  id: string;
  userId: string;
  proposalId: string | null;
  input: string;
  provider: "mock" | "openai";
  model: string;
  promptVersion?: string;
  status: "created" | "running" | "awaiting_clarification" | "ready_for_review" | "approved" | "rejected" | "failed" | "expired" | "completed";
  stepCount: number;
  toolCallsJson: Array<Record<string, unknown>>;
  progressEventsJson?: Array<Record<string, unknown>>;
  usageJson?: Record<string, unknown> | null;
  errorCategory?: string | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
};

/** A life event plus everything attached to it, for the detail screen. */
export type LifeEventDetail = LifeEventRecord & {
  tasks: TaskRecord[];
  reminders: ReminderRecord[];
  waiting: WaitingItemRecord[];
  activity: ActivityRecord[];
};

/** Counts the events list needs to show progress without loading every task. */
export type LifeEventSummary = LifeEventRecord & {
  totalTasks: number;
  completedTasks: number;
  nextTask: TaskRecord | null;
  waitingCount: number;
};

export type DashboardData = {
  profile: {
    name: string;
    timezone: string;
    reminderPreference: string;
    notificationEmail: string | null;
  };
  today: TaskRecord[];
  upcoming: TaskRecord[];
  waiting: WaitingItemRecord[];
  lifeEvents: LifeEventSummary[];
  proposals: ProposalRecord[];
  recentlyCompleted: TaskRecord[];
  activity: ActivityRecord[];
};
