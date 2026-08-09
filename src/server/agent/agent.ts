import "server-only";

import { agentProposalSchema, situationInputSchema } from "@/lib/validations/proposal";
import { getAgentProvider, getDataRepository } from "@/server/providers";

const rateLimit = new Map<string, { count: number; resetAt: number }>();

export async function createAgentProposal(userId: string, body: unknown) {
  const parsed = situationInputSchema.parse(body);
  const window = rateLimit.get(userId);
  const now = Date.now();
  if (window && window.resetAt > now && window.count >= 8) {
    throw new Error("Too many agent requests. Try again in a few minutes.");
  }
  rateLimit.set(userId, {
    count: window && window.resetAt > now ? window.count + 1 : 1,
    resetAt: window && window.resetAt > now ? window.resetAt : now + 10 * 60 * 1000,
  });

  const agent = getAgentProvider();
  const repository = getDataRepository();
  const result = await agent.createProposal(
    parsed.clarificationAnswer ? `${parsed.input}\nClarification: ${parsed.clarificationAnswer}` : parsed.input,
  );
  const proposal = agentProposalSchema.parse(result.proposal);

  const record = await repository.createProposal(userId, {
    originalInput: parsed.input,
    proposal,
    clarificationQuestion: proposal.clarificationQuestions[0],
    conversationContextJson: {
      proposalId: parsed.proposalId,
      clarificationAnswer: parsed.clarificationAnswer,
    },
  });

  await repository.recordAgentRun(userId, {
    proposalId: record.id,
    input: parsed.input,
    provider: result.provider,
    model: result.model,
    status: proposal.clarificationQuestions.length ? "awaiting_clarification" : "completed",
    stepCount: result.stepCount,
    toolCallsJson: result.toolCalls.map((call) => ({ ...call })),
    errorMessage: null,
    completedAt: new Date().toISOString(),
  });

  return {
    proposalId: record.id,
    proposal,
    model: result.model,
    toolCalls: result.toolCalls,
    stepCount: result.stepCount,
    progress: result.progress,
  };
}
