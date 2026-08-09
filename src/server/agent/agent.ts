import "server-only";

import { agentProposalSchema, situationInputSchema } from "@/lib/validations/proposal";
import { toAgentErrorCategory } from "@/server/agent/errors";
import { AGENT_PROMPT_VERSION } from "@/server/agent/instructions";
import { transitionAgentState } from "@/server/agent/state";
import { getAgentProvider, getDataRepository } from "@/server/providers";

const rateLimit = new Map<string, { count: number; resetAt: number }>();

export async function createAgentProposal(userId: string, body: unknown) {
  const parsed = situationInputSchema.parse(body);
  const runId = `run-${crypto.randomUUID()}`;
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
  let state = transitionAgentState("created", "running");
  const input = parsed.clarificationAnswer ? `${parsed.input}\nClarification: ${parsed.clarificationAnswer}` : parsed.input;
  const startedAt = Date.now();

  try {
    const result = await agent.createProposal(input, {
      runId,
      userId,
      repository,
      originalInput: parsed.input,
      proposalId: parsed.proposalId,
      clarificationAnswer: parsed.clarificationAnswer,
    });
    const proposal = agentProposalSchema.parse(result.proposal);
    state = transitionAgentState(state, proposal.clarificationQuestions.length ? "awaiting_clarification" : "ready_for_review");

    const record = await repository.createProposal(userId, {
      originalInput: parsed.input,
      proposal,
      clarificationQuestion: proposal.clarificationQuestions[0],
      conversationContextJson: {
        proposalId: parsed.proposalId,
        clarificationAnswer: parsed.clarificationAnswer,
        runId,
        state,
        promptVersion: AGENT_PROMPT_VERSION,
      },
    });

    await repository.recordAgentRun(userId, {
      proposalId: record.id,
      input: parsed.input,
      provider: result.provider,
      model: result.model,
      promptVersion: AGENT_PROMPT_VERSION,
      status: state,
      stepCount: result.stepCount,
      toolCallsJson: result.toolCalls.map((call) => ({ ...call })),
      progressEventsJson: result.progressEvents.map((event) => ({ ...event })),
      usageJson: { ...(result.usage ?? {}), durationMs: Date.now() - startedAt },
      errorCategory: null,
      errorMessage: null,
      completedAt: new Date().toISOString(),
    });

    return {
      runId,
      proposalId: record.id,
      proposal,
      model: result.model,
      toolCalls: result.toolCalls,
      stepCount: result.stepCount,
      progress: result.progress,
      progressEvents: result.progressEvents,
    };
  } catch (error) {
    state = transitionAgentState(state, "failed");
    await repository.recordAgentRun(userId, {
      proposalId: parsed.proposalId ?? null,
      input: parsed.input,
      provider: agent.constructor.name.includes("OpenAI") ? "openai" : "mock",
      model: agent.constructor.name.includes("OpenAI") ? "configured-openai-model" : "mock-sonae-v1",
      promptVersion: AGENT_PROMPT_VERSION,
      status: state,
      stepCount: 0,
      toolCallsJson: [],
      progressEventsJson: [{ runId, type: "failed", timestamp: new Date().toISOString(), message: "The run failed." }],
      usageJson: { durationMs: Date.now() - startedAt },
      errorCategory: toAgentErrorCategory(error),
      errorMessage: error instanceof Error ? error.message : "Agent failed.",
      completedAt: new Date().toISOString(),
    });
    throw error;
  }
}
