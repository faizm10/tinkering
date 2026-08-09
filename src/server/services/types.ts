import type { AgentProposal } from "@/lib/validations/proposal";

export type LifeEventRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "draft" | "active" | "completed" | "archived";
  startDate: string | null;
  endDate: string | null;
};

export type TaskRecord = {
  id: string;
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
  lifeEventId: string | null;
  title: string;
  description: string;
  waitingOn: string;
  expectedBy: string | null;
  followUpDate: string | null;
  status: "waiting" | "follow_up_due" | "resolved" | "cancelled";
};

export type ReminderRecord = {
  id: string;
  taskId: string | null;
  lifeEventId: string | null;
  title: string;
  remindAt: string;
  status: "scheduled" | "sent" | "dismissed" | "cancelled";
};

export type ProposalRecord = {
  id: string;
  originalInput: string;
  proposedPlanJson: AgentProposal;
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: string;
  reviewedAt: string | null;
  clarificationQuestion?: string;
};

export type ActivityRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
};

export type DashboardData = {
  profile: {
    name: string;
    timezone: string;
    reminderPreference: string;
  };
  today: TaskRecord[];
  upcoming: TaskRecord[];
  waiting: WaitingItemRecord[];
  lifeEvents: LifeEventRecord[];
  proposals: ProposalRecord[];
  recentlyCompleted: TaskRecord[];
  activity: ActivityRecord[];
};
