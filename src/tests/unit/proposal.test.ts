import { describe, expect, it } from "vitest";
import { clearProposalTasks, removeProposalTask } from "@/lib/proposal-draft";
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

  it("normalizes overlong assumptions without rejecting the proposal", () => {
    const proposal = agentProposalSchema.parse({
      summary: "Created a moving plan.",
      assumptions: [
        "The user said they are moving on Aug 20 and needs address changes, packing, and new room purchases, but did not provide the old or new address, exact packing inventory, room dimensions, budget, or vendor preferences.",
      ],
      lifeEvent: {
        title: "Move to New House",
        description: "Prepare for the move.",
        category: "moving",
        startDate: "2026-08-20",
        endDate: "2026-08-20",
      },
      tasks: [{ title: "Update important addresses", description: "Change account addresses.", priority: "high", dueDate: "2026-08-19" }],
      reminders: [],
      waitingItems: [],
      clarificationQuestions: [],
    });

    expect(proposal.assumptions[0].length).toBeLessThanOrEqual(180);
  });

  it("accepts expanded admin categories", () => {
    const proposal = agentProposalSchema.parse({
      summary: "Created a bill-payment plan.",
      category: "bill_payment",
      lifeEvent: {
        title: "Rent Payment",
        description: "Track payment before the deadline.",
        category: "bill_payment",
        startDate: "2026-08-24",
        endDate: "2026-08-28",
      },
      tasks: [{ title: "Save payment confirmation", description: "", priority: "medium", dueDate: "2026-08-28" }],
      reminders: [],
      waitingItems: [],
      clarificationQuestions: [],
    });

    expect(proposal.category).toBe("bill_payment");
    expect(proposal.lifeEvent.category).toBe("bill_payment");
  });

  it("clears generated tasks and removes reminder task links", () => {
    const proposal = agentProposalSchema.parse({
      summary: "Created a moving plan.",
      lifeEvent: { title: "Move", description: "", category: "moving", startDate: null, endDate: null },
      tasks: [{ temporaryId: "task_1", title: "Update address", description: "", priority: "medium", dueDate: null }],
      reminders: [{ title: "Address reminder", remindAt: "2026-08-25T09:00:00-04:00", relatedTaskId: "task_1", relatedTaskIndex: 0 }],
      waitingItems: [],
      clarificationQuestions: [],
    });

    const cleared = clearProposalTasks(proposal);

    expect(cleared.tasks).toHaveLength(0);
    expect(cleared.reminders[0]).not.toHaveProperty("relatedTaskId");
    expect(cleared.reminders[0]).not.toHaveProperty("relatedTaskIndex");
    expect(() => agentProposalSchema.parse(cleared)).not.toThrow();
  });

  it("removes one generated task and keeps remaining reminder links valid", () => {
    const proposal = agentProposalSchema.parse({
      summary: "Created a moving plan.",
      lifeEvent: { title: "Move", description: "", category: "moving", startDate: null, endDate: null },
      tasks: [
        { title: "Book movers", description: "", priority: "medium", dueDate: null },
        { title: "Update address", description: "", priority: "high", dueDate: null },
      ],
      reminders: [
        { title: "Movers reminder", remindAt: "2026-08-24T09:00:00-04:00", relatedTaskIndex: 0 },
        { title: "Address reminder", remindAt: "2026-08-25T09:00:00-04:00", relatedTaskId: "task_2", relatedTaskIndex: 1 },
      ],
      waitingItems: [],
      clarificationQuestions: [],
    });

    const updated = removeProposalTask(proposal, 0);

    expect(updated.tasks.map((task) => task.title)).toEqual(["Update address"]);
    expect(updated.reminders[0]).not.toHaveProperty("relatedTaskIndex");
    expect(updated.reminders[1].relatedTaskId).toBe("task_1");
    expect(updated.reminders[1].relatedTaskIndex).toBe(0);
    expect(() => agentProposalSchema.parse(updated)).not.toThrow();
  });
});
