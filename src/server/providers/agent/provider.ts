import type { AgentProposal } from "@/lib/validations/proposal";
import type { ToolCallLog } from "@/server/agent/tools";
import type { DataRepository } from "@/server/providers/data/repository";

export type AgentProgressStage = "understanding" | "checking_dates" | "reviewing_context" | "organizing" | "awaiting_clarification" | "validating" | "ready" | "failed";

export type AgentProgressEvent = {
  runId: string;
  type: AgentProgressStage;
  timestamp: string;
  message: string;
};

export type AgentProviderContext = {
  runId: string;
  userId: string;
  repository: DataRepository;
  originalInput?: string;
  proposalId?: string;
  clarificationAnswer?: string;
};

export type AgentProviderResult = {
  proposal: AgentProposal;
  toolCalls: ToolCallLog[];
  stepCount: number;
  provider: "mock" | "openai";
  model: string;
  progress: AgentProgressStage[];
  progressEvents: AgentProgressEvent[];
  usage?: Record<string, unknown> | null;
};

export interface AgentProvider {
  createProposal(input: string, context?: AgentProviderContext): Promise<AgentProviderResult>;
}
