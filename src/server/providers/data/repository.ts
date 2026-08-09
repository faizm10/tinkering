import type { AgentProposal } from "@/lib/validations/proposal";
import type {
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

export interface DataRepository {
  getDashboardData(userId: string): Promise<DashboardData>;
  getProfile(userId: string): Promise<DashboardData["profile"]>;
  updateProfile(userId: string, profile: DashboardData["profile"]): Promise<DashboardData["profile"]>;
  listLifeEvents(userId: string): Promise<LifeEventSummary[]>;
  getLifeEvent(userId: string, eventId: string): Promise<LifeEventDetail | null>;
  createLifeEvent(userId: string, input: CreateLifeEventInput): Promise<string>;
  updateLifeEvent(userId: string, eventId: string, input: Partial<CreateLifeEventInput>): Promise<LifeEventSummary>;
  completeLifeEvent(userId: string, eventId: string): Promise<void>;
  listTasks(userId: string): Promise<TaskRecord[]>;
  createTask(userId: string, input: CreateTaskInput): Promise<TaskRecord>;
  updateTask(userId: string, taskId: string, input: Partial<CreateTaskInput>): Promise<TaskRecord>;
  setTaskCompleted(userId: string, taskId: string, completed: boolean): Promise<TaskRecord>;
  listWaitingItems(userId: string): Promise<WaitingItemRecord[]>;
  createWaitingItem(userId: string, input: CreateWaitingItemInput): Promise<WaitingItemRecord>;
  resolveWaitingItem(userId: string, waitingId: string): Promise<WaitingItemRecord>;
  createReminder(userId: string, input: CreateReminderInput): Promise<ReminderRecord>;
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
}
