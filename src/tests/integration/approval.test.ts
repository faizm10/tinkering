import { describe, expect, it } from "vitest";
import { inferProposalFromInput } from "@/server/agent/tools";
import { createDemoProposal, approveDemoProposal } from "@/server/services/demo-store";

describe("proposal approval", () => {
  it("prevents duplicate approval", () => {
    const proposal = createDemoProposal("I bought headphones today and have 30 days to return them.", inferProposalFromInput("I bought headphones today and have 30 days to return them."));
    const eventId = approveDemoProposal(proposal.id, proposal.proposedPlanJson);

    expect(eventId).toContain("event");
    expect(() => approveDemoProposal(proposal.id, proposal.proposedPlanJson)).toThrow("already");
  });
});
