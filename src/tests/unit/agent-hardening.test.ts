import { describe, expect, it } from "vitest";

import { agentProposalSchema } from "@/lib/validations/proposal";
import { resolveDateExpression } from "@/server/agent/date-resolver";
import { AgentToolRegistry } from "@/server/agent/tools";
import { transitionAgentState } from "@/server/agent/state";
import { ProposalBuilder } from "@/server/agent/proposal-builder";
import { AGENT_PROMPT_VERSION } from "@/server/agent/instructions";
import { MemoryDataRepository } from "@/server/providers/data/memory-repository";

describe("agent hardening", () => {
  it("validates cross references and item limits", () => {
    expect(() =>
      agentProposalSchema.parse({
        version: 1,
        summary: "Invalid reminder.",
        category: "moving",
        confidence: "high",
        assumptions: [],
        lifeEvent: { title: "Move", description: "", category: "moving", startDate: "2026-09-01", endDate: "2026-09-02" },
        tasks: [{ temporaryId: "task_1", title: "Task", description: "", priority: "medium", dueDate: "2026-09-02" }],
        reminders: [{ temporaryId: "reminder_1", title: "Reminder", remindAt: "2026-08-25T09:00:00-04:00", relatedTaskId: "missing" }],
        waitingItems: [],
        clarificationQuestions: [],
      }),
    ).toThrow();
  });

  it("resolves date ranges deterministically", () => {
    const resolved = resolveDateExpression("August 16 to August 20", "America/Toronto", new Date("2026-08-09T12:00:00"));
    expect(resolved.startDate).toBe("2026-08-16");
    expect(resolved.endDate).toBe("2026-08-20");
    expect(resolved.requiresClarification).toBe(false);
  });

  it("resolves abbreviated month dates deterministically", () => {
    const resolved = resolveDateExpression("i will be moving on aug 20", "America/Toronto", new Date("2026-08-09T12:00:00"));
    expect(resolved.startDate).toBe("2026-08-20");
    expect(resolved.endDate).toBe("2026-08-20");
    expect(resolved.requiresClarification).toBe(false);
  });

  it("resolves weekday and relative admin deadlines deterministically", () => {
    const friday = resolveDateExpression("rent is due by Friday", "America/Toronto", new Date("2026-08-24T12:00:00"));
    expect(friday.endDate).toBe("2026-08-28");

    const twoWeeks = resolveDateExpression("trial renews in two weeks", "America/Toronto", new Date("2026-08-24T12:00:00"));
    expect(twoWeeks.endDate).toBe("2026-09-07");

    const monthEnd = resolveDateExpression("forms are due by the end of month", "America/Toronto", new Date("2026-08-24T12:00:00"));
    expect(monthEnd.endDate).toBe("2026-08-31");
  });

  it("rejects invalid state transitions", () => {
    expect(() => transitionAgentState("created", "ready_for_review")).toThrow();
    expect(transitionAgentState("created", "running")).toBe("running");
  });

  it("validates tool arguments and blocks repeated identical calls", async () => {
    const registry = new AgentToolRegistry();
    const repository = new MemoryDataRepository();
    const context = { userId: "tool-user", repository, builder: new ProposalBuilder(), timezone: "America/Toronto" };

    const first = await registry.execute("resolve_date_expression", { expression: "tomorrow" }, context);
    expect(first.success).toBe(true);

    const repeated = await registry.execute("resolve_date_expression", { expression: "tomorrow" }, context);
    expect(repeated.success).toBe(false);
  });

  it("records explicit proposal assumptions through a safe temporary tool", async () => {
    const registry = new AgentToolRegistry();
    const repository = new MemoryDataRepository();
    const builder = new ProposalBuilder();
    const context = { userId: "assumption-user", repository, builder, timezone: "America/Toronto" };

    await registry.execute("propose_life_event", {
      title: "Bill Payment",
      description: "Track a bill before the due date.",
      category: "bill_payment",
      startDate: "2026-08-24",
      endDate: "2026-08-28",
    }, context);
    await registry.execute("propose_task", {
      temporaryId: "task_1",
      title: "Save payment confirmation",
      description: "Keep proof after paying.",
      priority: "medium",
      dueDate: "2026-08-28",
    }, context);
    const assumption = await registry.execute("record_assumption", {
      assumption: "Assumed the user will make the payment themselves.",
    }, context);
    const finalized = await registry.execute("finalize_proposal", {
      summary: "Created a bill-payment plan.",
      category: "bill_payment",
      confidence: "high",
    }, context);

    expect(assumption.success).toBe(true);
    expect((finalized.result as { proposal?: { assumptions: string[] } }).proposal?.assumptions).toContain("Assumed the user will make the payment themselves.");
  });

  it("records a versioned prompt identifier", () => {
    expect(AGENT_PROMPT_VERSION).toBe("sonae-v3");
  });
});
