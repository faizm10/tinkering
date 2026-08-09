import { describe, expect, it } from "vitest";
import { MockAgentProvider } from "@/server/providers/agent/mock-agent";
import { MemoryDataRepository } from "@/server/providers/data/memory-repository";

describe("provider-backed vertical slice", () => {
  it("creates, approves, completes, and logs a plan without external credentials", async () => {
    const userId = `test-user-${Date.now()}`;
    const repository = new MemoryDataRepository();
    const agent = new MockAgentProvider();

    await repository.updateProfile(userId, {
      name: "Test User",
      timezone: "America/Toronto",
      reminderPreference: "Morning digest",
    });

    const result = await agent.createProposal("I’m moving on September 1.");
    const proposal = await repository.createProposal(userId, {
      originalInput: "I’m moving on September 1.",
      proposal: result.proposal,
    });

    const eventId = await repository.approveProposal(userId, proposal.id, {
      ...result.proposal,
      tasks: result.proposal.tasks.map((task, index) =>
        index === 0 ? { ...task, title: "Update primary banking address" } : task,
      ),
    });

    const updatedEvent = await repository.updateLifeEvent(userId, eventId, {
      title: "Move Apartment",
      endDate: "2026-09-02",
    });
    expect(updatedEvent.title).toBe("Move Apartment");

    const detail = await repository.getLifeEvent(userId, eventId);
    expect(detail?.tasks.map((task) => task.title)).toContain("Update primary banking address");

    const updatedTask = await repository.updateTask(userId, detail!.tasks[0].id, {
      priority: "high",
      dueDate: "2026-08-30",
    });
    expect(updatedTask.priority).toBe("high");
    expect(updatedTask.dueDate).toBe("2026-08-30");

    const completed = await repository.setTaskCompleted(userId, detail!.tasks[0].id, true);
    expect(completed.status).toBe("completed");

    const reopened = await repository.setTaskCompleted(userId, detail!.tasks[0].id, false);
    expect(reopened.status).toBe("pending");

    const dashboard = await repository.getDashboardData(userId);
    expect(dashboard.lifeEvents.some((event) => event.id === eventId)).toBe(true);
    expect(dashboard.activity.some((entry) => entry.entityId === completed.id)).toBe(true);
  });

  it("enforces ownership checks", async () => {
    const repository = new MemoryDataRepository();
    const eventId = await repository.createLifeEvent("owner-a", {
      title: "Private Event",
      description: "",
      category: "general",
      startDate: null,
      endDate: null,
    });

    await expect(repository.getLifeEvent("owner-b", eventId)).resolves.toBeNull();
    await expect(repository.completeLifeEvent("owner-b", eventId)).rejects.toThrow("not found");
  });
});
