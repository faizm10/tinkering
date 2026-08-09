import { describe, expect, it } from "vitest";
import { FakeModelAdapter } from "@/server/agent/model-adapter";

describe("fake model adapter", () => {
  it("creates a moving proposal without calling OpenAI", async () => {
    const result = await new FakeModelAdapter().createProposal("I am moving on September 1");
    expect(result.proposal.lifeEvent.category).toBe("moving");
    expect(result.proposal.tasks.length).toBeGreaterThan(0);
    expect(result.stepCount).toBeLessThanOrEqual(8);
  });

  it("asks for clarification when a move date is missing", async () => {
    const result = await new FakeModelAdapter().createProposal("I am moving soon");
    expect(result.proposal.clarificationQuestions[0]).toContain("date");
  });
});
