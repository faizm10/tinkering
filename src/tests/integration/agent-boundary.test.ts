import { describe, expect, it } from "vitest";

import { MockAgentProvider } from "@/server/providers/agent/mock-agent";
import { MemoryDataRepository } from "@/server/providers/data/memory-repository";
import { agentEvalCases, runAgentEvaluations } from "@/server/agent/evaluator";

describe("agent boundary", () => {
  it("does not allow approval while clarification is pending", async () => {
    const userId = `clarify-user-${Date.now()}`;
    const repository = new MemoryDataRepository();
    const provider = new MockAgentProvider();
    const result = await provider.createProposal("I’m moving soon.", { runId: "clarify-run", userId, repository });
    const record = await repository.createProposal(userId, {
      originalInput: "I’m moving soon.",
      proposal: result.proposal,
      clarificationQuestion: result.proposal.clarificationQuestions[0],
      conversationContextJson: { state: "awaiting_clarification" },
    });

    await expect(repository.approveProposal(userId, record.id, result.proposal)).rejects.toThrow("clarification");
  });

  it("runs the default mock eval suite", async () => {
    const results = await runAgentEvaluations();
    expect(results).toHaveLength(agentEvalCases.length);
    expect(results.filter((result) => result.passed)).toHaveLength(agentEvalCases.length);
  });
});
