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

  it("records a versioned prompt identifier", () => {
    expect(AGENT_PROMPT_VERSION).toBe("sonae-v1");
  });
});
