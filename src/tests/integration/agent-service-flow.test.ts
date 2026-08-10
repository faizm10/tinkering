import { randomUUID } from "crypto";

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

config({ path: ".env.local", quiet: true });

const runAgentServiceTest = process.env.RUN_AGENT_SERVICE_TEST === "1";
const describeIf = runAgentServiceTest ? describe : describe.skip;

describeIf("agent service flow", () => {
  const userId = `agent-service-${Date.now()}-${randomUUID()}`;

  afterAll(async () => {
    const [{ db }, { activityLogs, agentProposals, agentRuns, lifeEvents, reminders, tasks, waitingItems }] = await Promise.all([
      import("@/db"),
      import("@/db/schema"),
    ]);

    await db.delete(agentRuns).where(eq(agentRuns.userId, userId));
    await db.delete(activityLogs).where(eq(activityLogs.userId, userId));
    await db.delete(reminders).where(eq(reminders.userId, userId));
    await db.delete(waitingItems).where(eq(waitingItems.userId, userId));
    await db.delete(tasks).where(eq(tasks.userId, userId));
    await db.delete(lifeEvents).where(eq(lifeEvents.userId, userId));
    await db.delete(agentProposals).where(eq(agentProposals.userId, userId));
  });

  it("creates, stores, and approves a moving proposal from the dashboard prompt", async () => {
    const [
      { agentProposalSchema },
      { AGENT_PROMPT_VERSION },
      { transitionAgentState },
      { OpenAIAgentProvider },
      { DrizzleDataRepository },
    ] = await Promise.all([
      import("@/lib/validations/proposal"),
      import("@/server/agent/instructions"),
      import("@/server/agent/state"),
      import("@/server/providers/agent/openai-agent"),
      import("@/server/providers/data/drizzle-repository"),
    ]);
    const input = "i will be moving on aug 20. i need to make sure i change my address, pack accordingly as well as get new stuff for my new room";
    const runId = `agent-service-run-${Date.now()}`;
    const startedAt = Date.now();
    const repository = new DrizzleDataRepository();
    const provider = new OpenAIAgentProvider();

    const result = await provider.createProposal(input, {
      runId,
      userId,
      repository,
      originalInput: input,
    });
    const proposal = agentProposalSchema.parse(result.proposal);
    const status = transitionAgentState("running", proposal.clarificationQuestions.length ? "awaiting_clarification" : "ready_for_review");
    const record = await repository.createProposal(userId, {
      originalInput: input,
      proposal,
      clarificationQuestion: proposal.clarificationQuestions[0],
      conversationContextJson: {
        runId,
        state: status,
        promptVersion: AGENT_PROMPT_VERSION,
      },
    });
    await repository.recordAgentRun(userId, {
      proposalId: record.id,
      input,
      provider: result.provider,
      model: result.model,
      promptVersion: AGENT_PROMPT_VERSION,
      status,
      stepCount: result.stepCount,
      toolCallsJson: result.toolCalls.map((call) => ({ ...call })),
      progressEventsJson: result.progressEvents.map((event) => ({ ...event })),
      usageJson: { ...(result.usage ?? {}), durationMs: Date.now() - startedAt },
      errorCategory: null,
      errorMessage: null,
      completedAt: new Date().toISOString(),
    });

    expect(record.id).toEqual(expect.any(String));
    expect(proposal.category).toBe("moving");
    expect(proposal.tasks.length).toBeGreaterThan(1);
    expect(proposal.clarificationQuestions).toHaveLength(0);

    const eventId = await repository.approveProposal(userId, record.id, proposal);
    expect(eventId).toEqual(expect.any(String));
  }, 90_000);
});
