import { describe, expect, it } from "vitest";
import { MockAgentProvider } from "@/server/providers/agent/mock-agent";

describe("MockAgentProvider", () => {
  const provider = new MockAgentProvider();

  it("creates the requested moving vertical slice proposal", async () => {
    const result = await provider.createProposal("I’m moving on September 1.");

    expect(result.provider).toBe("mock");
    expect(result.proposal.lifeEvent.title).toBe("Move to New House");
    expect(result.proposal.tasks.map((task) => task.title)).toContain("Transfer internet service");
    expect(result.proposal.reminders.length).toBeGreaterThan(0);
  });

  it("asks for clarification when a moving date is missing", async () => {
    const result = await provider.createProposal("I’m moving soon.");

    expect(result.proposal.tasks).toHaveLength(0);
    expect(result.proposal.clarificationQuestions[0]).toBe("What date are you moving?");
  });

  it("continues after clarification without asking again", async () => {
    const result = await provider.createProposal("I’m moving soon.\nClarification: September 1.");

    expect(result.proposal.clarificationQuestions).toHaveLength(0);
    expect(result.proposal.tasks.length).toBeGreaterThan(1);
  });
});
