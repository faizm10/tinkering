import { config } from "dotenv";
import { describe, expect, it } from "vitest";

config({ path: ".env.local", quiet: true });

const runOpenAIAgentTest = process.env.RUN_OPENAI_AGENT_TEST === "1";
const describeIf = runOpenAIAgentTest ? describe : describe.skip;

describeIf("OpenAI agent provider smoke test", () => {
  it("creates a structured proposal from the configured OpenAI model", async () => {
    const [{ OpenAIAgentProvider }, { MemoryDataRepository }] = await Promise.all([
      import("@/server/providers/agent/openai-agent"),
      import("@/server/providers/data/memory-repository"),
    ]);
    const repository = new MemoryDataRepository();
    const provider = new OpenAIAgentProvider();
    const userId = `openai-smoke-${Date.now()}`;

    const result = await provider.createProposal("I am moving on August 20.", {
      runId: `openai-run-${Date.now()}`,
      userId,
      repository,
      originalInput: "I am moving on August 20.",
    });

    expect(result.provider).toBe("openai");
    expect(result.model).toBe(process.env.OPENAI_MODEL);
    expect(result.proposal.lifeEvent.title).toEqual(expect.any(String));
    expect(result.proposal.tasks.length).toBeGreaterThan(0);
  }, 90_000);
});
