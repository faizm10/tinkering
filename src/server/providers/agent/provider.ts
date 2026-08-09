import type { AgentProposal } from "@/lib/validations/proposal";
import type { ToolCallLog } from "@/server/agent/tools";

export type AgentProgressStage = "understanding" | "checking_dates" | "reviewing_context" | "organizing" | "ready";

export type AgentProviderResult = {
  proposal: AgentProposal;
  toolCalls: ToolCallLog[];
  stepCount: number;
  provider: "mock" | "openai";
  model: string;
  progress: AgentProgressStage[];
};

export interface AgentProvider {
  createProposal(input: string): Promise<AgentProviderResult>;
}
