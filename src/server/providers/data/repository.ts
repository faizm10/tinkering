import type { AgentProposal } from "@/lib/validations/proposal";
import type {
  AgentConversationRecord,
  AgentMessageRecord,
  AgentMessageRole,
  AgentRunRecord,
  DashboardData,
  LifeEventDetail,
  LifeEventSummary,
  ProposalRecord,
  ReminderRecord,
  TaskRecord,
  WaitingItemRecord,
} from "@/server/services/types";

export type CreateLifeEventInput = {
  title: string;
  description: string;
  category: string;
  startDate: string | null;
  endDate: string | null;
};

export type CreateTaskInput = {
  lifeEventId: string | null;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  source?: string;
};

export type CreateWaitingItemInput = {
  lifeEventId: string | null;
  title: string;
  description: string;
  waitingOn: string;
  expectedBy: string | null;
  followUpDate: string | null;
};

export type CreateReminderInput = {
  taskId: string | null;
  lifeEventId: string | null;
  title: string;
  remindAt: string;
};

export type ReminderDeliveryPatch = {
  deliveryStatus?: ReminderRecord["deliveryStatus"];
  deliveryRecipientEmail?: string | null;
  qstashMessageId?: string | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  lastAttemptAt?: string | null;
  failureCount?: number;
  lastError?: string | null;
  status?: ReminderRecord["status"];
};

export type AppendAgentMessageInput = {
  conversationId: string;
  role: AgentMessageRole;
  partsJson: Array<Record<string, unknown>>;
  metadataJson?: Record<string, unknown>;
};

export interface DataRepository {
  getDashboardData(userId: string): Promise<DashboardData>;
  getProfile(userId: string): Promise<DashboardData["profile"]>;
  updateProfile(userId: string, profile: DashboardData["profile"]): Promise<DashboardData["profile"]>;
  listLifeEvents(userId: string): Promise<LifeEventSummary[]>;
  getLifeEvent(userId: string, eventId: string): Promise<LifeEventDetail | null>;
  createLifeEvent(userId: string, input: CreateLifeEventInput): Promise<string>;
  updateLifeEvent(userId: string, eventId: string, input: Partial<CreateLifeEventInput>): Promise<LifeEventSummary>;
  completeLifeEvent(userId: string, eventId: string): Promise<void>;
  deleteLifeEvent(userId: string, eventId: string): Promise<void>;
  listTasks(userId: string): Promise<TaskRecord[]>;
  createTask(userId: string, input: CreateTaskInput): Promise<TaskRecord>;
  updateTask(userId: string, taskId: string, input: Partial<CreateTaskInput>): Promise<TaskRecord>;
  deleteTask(userId: string, taskId: string): Promise<void>;
  setTaskCompleted(userId: string, taskId: string, completed: boolean): Promise<TaskRecord>;
  listWaitingItems(userId: string): Promise<WaitingItemRecord[]>;
  createWaitingItem(userId: string, input: CreateWaitingItemInput): Promise<WaitingItemRecord>;
  updateWaitingItem(userId: string, waitingId: string, input: Partial<CreateWaitingItemInput>): Promise<WaitingItemRecord>;
  deleteWaitingItem(userId: string, waitingId: string): Promise<void>;
  resolveWaitingItem(userId: string, waitingId: string): Promise<WaitingItemRecord>;
  createReminder(userId: string, input: CreateReminderInput): Promise<ReminderRecord>;
  updateReminder(userId: string, reminderId: string, input: Partial<CreateReminderInput>): Promise<ReminderRecord>;
  deleteReminder(userId: string, reminderId: string): Promise<void>;
  getReminder(userId: string, reminderId: string): Promise<ReminderRecord | null>;
  listRemindersForEvent(userId: string, eventId: string): Promise<ReminderRecord[]>;
  listDueReminders(nowIso: string, limit: number): Promise<ReminderRecord[]>;
  updateReminderDelivery(userId: string, reminderId: string, input: ReminderDeliveryPatch): Promise<ReminderRecord | null>;
  listProposals(userId: string): Promise<ProposalRecord[]>;
  getProposal(userId: string, proposalId: string): Promise<ProposalRecord | null>;
  createProposal(
    userId: string,
    input: {
      originalInput: string;
      proposal: AgentProposal;
      conversationContextJson?: Record<string, unknown>;
      clarificationQuestion?: string;
    },
  ): Promise<ProposalRecord>;
  approveProposal(userId: string, proposalId: string, editedProposal: AgentProposal): Promise<string>;
  rejectProposal(userId: string, proposalId: string): Promise<void>;
  recordAgentRun(userId: string, run: Omit<AgentRunRecord, "id" | "userId" | "startedAt">): Promise<AgentRunRecord>;
  listAgentConversations(userId: string): Promise<AgentConversationRecord[]>;
  getAgentConversation(userId: string, conversationId: string): Promise<AgentConversationRecord | null>;
  createAgentConversation(userId: string, title?: string): Promise<AgentConversationRecord>;
  listAgentMessages(userId: string, conversationId: string): Promise<AgentMessageRecord[]>;
  appendAgentMessage(userId: string, input: AppendAgentMessageInput): Promise<AgentMessageRecord>;
}
