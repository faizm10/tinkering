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
      notificationEmail: null,
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

  it("deletes a life event without deleting the user's loose tasks", async () => {
    const userId = `delete-user-${Date.now()}`;
    const repository = new MemoryDataRepository();
    const eventId = await repository.createLifeEvent(userId, {
      title: "Move Apartment",
      description: "",
      category: "moving",
      startDate: "2026-08-20",
      endDate: "2026-08-20",
    });
    const task = await repository.createTask(userId, {
      lifeEventId: eventId,
      title: "Update address",
      description: "",
      priority: "high",
      dueDate: "2026-08-19",
    });
    await repository.createWaitingItem(userId, {
      lifeEventId: eventId,
      title: "Confirm elevator booking",
      description: "",
      waitingOn: "Building manager",
      expectedBy: "2026-08-15",
      followUpDate: "2026-08-14",
    });
    await repository.createReminder(userId, {
      lifeEventId: eventId,
      taskId: null,
      title: "Pack essentials",
      remindAt: "2026-08-18T09:00:00-04:00",
    });

    await repository.deleteLifeEvent(userId, eventId);

    await expect(repository.getLifeEvent(userId, eventId)).resolves.toBeNull();
    const tasks = await repository.listTasks(userId);
    expect(tasks.find((entry) => entry.id === task.id)?.lifeEventId).toBeNull();
    const waiting = await repository.listWaitingItems(userId);
    expect(waiting[0]?.lifeEventId).toBeNull();
  });

  it("updates and deletes manual event attachments", async () => {
    const userId = `attachments-user-${Date.now()}`;
    const repository = new MemoryDataRepository();
    const eventId = await repository.createLifeEvent(userId, {
      title: "Renew Passport",
      description: "",
      category: "document_renewal",
      startDate: null,
      endDate: null,
    });

    const task = await repository.createTask(userId, {
      lifeEventId: eventId,
      title: "Find old passport",
      description: "",
      priority: "medium",
      dueDate: "2026-08-20",
    });
    const updatedTask = await repository.updateTask(userId, task.id, {
      title: "Find current passport",
      dueDate: null,
      priority: "high",
    });
    expect(updatedTask.title).toBe("Find current passport");
    expect(updatedTask.dueDate).toBeNull();
    expect(updatedTask.priority).toBe("high");

    const waiting = await repository.createWaitingItem(userId, {
      lifeEventId: eventId,
      title: "Photo appointment confirmation",
      description: "",
      waitingOn: "Photo studio",
      expectedBy: "2026-08-21",
      followUpDate: "2026-08-19",
    });
    const updatedWaiting = await repository.updateWaitingItem(userId, waiting.id, {
      waitingOn: "Passport office",
      expectedBy: null,
    });
    expect(updatedWaiting.waitingOn).toBe("Passport office");
    expect(updatedWaiting.expectedBy).toBeNull();

    const reminder = await repository.createReminder(userId, {
      lifeEventId: eventId,
      taskId: null,
      title: "Bring documents",
      remindAt: "2026-08-22T13:00:00-04:00",
    });
    const updatedReminder = await repository.updateReminder(userId, reminder.id, {
      title: "Bring passport documents",
      remindAt: "2026-08-23T13:00:00-04:00",
    });
    expect(updatedReminder.title).toBe("Bring passport documents");
    expect(updatedReminder.remindAt).toBe("2026-08-23T13:00:00-04:00");

    await repository.deleteReminder(userId, reminder.id);
    await repository.deleteWaitingItem(userId, waiting.id);
    await repository.deleteTask(userId, task.id);

    const detail = await repository.getLifeEvent(userId, eventId);
    expect(detail?.tasks).toHaveLength(0);
    expect(detail?.waiting).toHaveLength(0);
    expect(detail?.reminders).toHaveLength(0);
  });
});
