import { describe, expect, it } from "vitest";
import { agentProposalSchema } from "@/lib/validations/proposal";

describe("agentProposalSchema", () => {
  it("accepts a valid proposal", () => {
    const proposal = agentProposalSchema.parse({
      summary: "Created a moving plan.",
      lifeEvent: {
        title: "Move to New House",
        description: "Prepare for the move.",
        category: "moving",
        startDate: "2026-08-09",
        endDate: "2026-09-01",
      },
      tasks: [{ title: "Update banking address", description: "Change account addresses.", priority: "high", dueDate: "2026-09-01" }],
      reminders: [{ title: "Address reminder", remindAt: "2026-08-25T09:00:00-04:00", relatedTaskIndex: 0 }],
      waitingItems: [],
      clarificationQuestions: [],
    });

    expect(proposal.tasks[0].priority).toBe("high");
  });

  it("rejects excessive tasks", () => {
    expect(() =>
      agentProposalSchema.parse({
        summary: "Too much.",
        lifeEvent: { title: "Move", description: "", category: "moving", startDate: null, endDate: null },
        tasks: Array.from({ length: 13 }, (_, index) => ({ title: `Task ${index}`, description: "", priority: "medium", dueDate: null })),
        reminders: [],
        waitingItems: [],
        clarificationQuestions: [],
      }),
    ).toThrow();
  });
});
