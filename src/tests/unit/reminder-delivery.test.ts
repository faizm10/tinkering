import { describe, expect, it } from "vitest";

import { deliverReminder } from "@/server/reminders/delivery-service";
import { MemoryDataRepository } from "@/server/providers/data/memory-repository";

describe("reminder delivery", () => {
  it("creates reminders with delivery metadata", async () => {
    const repository = new MemoryDataRepository();
    const reminder = await repository.createReminder(`delivery-meta-${Date.now()}`, {
      taskId: null,
      lifeEventId: null,
      title: "Check reminder metadata",
      remindAt: new Date().toISOString(),
    });

    expect(reminder.deliveryStatus).toBe("pending");
    expect(reminder.deliveryVersion).toBe(1);
    expect(reminder.deliveryRecipientEmail).toBeNull();
    expect(reminder.failureCount).toBe(0);
  });

  it("sends a due reminder exactly once for the current delivery version", async () => {
    const repository = new MemoryDataRepository();
    const userId = `delivery-send-${Date.now()}`;
    const reminder = await repository.createReminder(userId, {
      taskId: null,
      lifeEventId: null,
      title: "Submit internship application",
      remindAt: new Date(Date.now() - 60_000).toISOString(),
    });
    await repository.updateReminderDelivery(userId, reminder.id, {
      deliveryRecipientEmail: "faiz@example.com",
      deliveryStatus: "scheduled",
    });

    const sent: string[] = [];
    const result = await deliverReminder(
      { reminderId: reminder.id, userId, deliveryVersion: reminder.deliveryVersion },
      {
        repository,
        emailSender: async ({ recipientEmail }) => {
          sent.push(recipientEmail);
        },
      },
    );

    const delivered = await repository.getReminder(userId, reminder.id);
    expect(result.status).toBe("sent");
    expect(sent).toEqual(["faiz@example.com"]);
    expect(delivered?.status).toBe("sent");
    expect(delivered?.deliveryStatus).toBe("sent");
  });

  it("ignores stale queued messages after a reminder edit", async () => {
    const repository = new MemoryDataRepository();
    const userId = `delivery-stale-${Date.now()}`;
    const reminder = await repository.createReminder(userId, {
      taskId: null,
      lifeEventId: null,
      title: "Original reminder",
      remindAt: new Date(Date.now() - 60_000).toISOString(),
    });
    await repository.updateReminderDelivery(userId, reminder.id, {
      deliveryRecipientEmail: "faiz@example.com",
      deliveryStatus: "scheduled",
    });

    const staleDeliveryVersion = reminder.deliveryVersion;
    const updated = await repository.updateReminder(userId, reminder.id, {
      title: "Edited reminder",
    });
    const result = await deliverReminder(
      { reminderId: reminder.id, userId, deliveryVersion: staleDeliveryVersion },
      {
        repository,
        emailSender: async () => {
          throw new Error("Stale deliveries should not call the email sender.");
        },
      },
    );

    const current = await repository.getReminder(userId, reminder.id);
    expect(updated.deliveryVersion).toBe(staleDeliveryVersion + 1);
    expect(result.status).toBe("ignored");
    expect(current?.status).toBe("scheduled");
    expect(current?.deliveryStatus).toBe("pending");
  });
});
