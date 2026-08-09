import "server-only";

import { agentProposalSchema, situationInputSchema } from "@/lib/validations/proposal";
import { getModelAdapter } from "@/server/agent/model-adapter";
import { createDemoProposal } from "@/server/services/demo-store";
import { env } from "@/lib/env";

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

  const adapter = getModelAdapter();
  const result = await adapter.createProposal(
    parsed.clarificationAnswer ? `${parsed.input}\nClarification: ${parsed.clarificationAnswer}` : parsed.input,
  );
  const proposal = agentProposalSchema.parse(result.proposal);

  const record = createDemoProposal(parsed.input, proposal, proposal.clarificationQuestions[0]);

  return {
    proposalId: record.id,
    proposal,
    model: env.OPENAI_MODEL,
    toolCalls: result.toolCalls,
    stepCount: result.stepCount,
  };
}
