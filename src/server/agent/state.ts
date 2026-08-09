import { AgentStateError } from "@/server/agent/errors";

export const agentStates = [
  "created",
  "running",
  "awaiting_clarification",
  "ready_for_review",
  "approved",
  "rejected",
  "failed",
  "expired",
] as const;

export type AgentState = (typeof agentStates)[number];

const validTransitions: Record<AgentState, AgentState[]> = {
  created: ["running"],
  running: ["awaiting_clarification", "ready_for_review", "failed"],
  awaiting_clarification: ["running", "expired"],
  ready_for_review: ["approved", "rejected", "expired"],
  approved: [],
  rejected: [],
  failed: [],
  expired: [],
};

export function assertAgentTransition(from: AgentState, to: AgentState) {
  if (!validTransitions[from].includes(to)) {
    throw new AgentStateError(`Invalid agent transition: ${from} -> ${to}`);
  }
}

export function transitionAgentState(from: AgentState, to: AgentState) {
  assertAgentTransition(from, to);
  return to;
}
