import "server-only";

import type { DataRepository } from "@/server/providers/data/repository";
import { ReminderEmailConfigError, sendReminderEmail, type ReminderEmailSender } from "@/server/reminders/email";
import {
  reminderDeliveryPayloadSchema,
  type ReminderDeliveryPayload,
  truncateDeliveryError,
} from "@/server/reminders/types";

const EARLY_DELIVERY_TOLERANCE_MS = 60_000;

export type ReminderDeliveryResult =
  | { status: "sent"; reminderId: string }
  | { status: "retry"; reminderId: string; reason: string }
  | { status: "ignored"; reminderId: string; reason: string };

export async function deliverReminder(
  payload: ReminderDeliveryPayload,
  options: { emailSender?: ReminderEmailSender; now?: Date; repository?: DataRepository } = {},
): Promise<ReminderDeliveryResult> {
  const parsed = reminderDeliveryPayloadSchema.parse(payload);
  const repository = options.repository ?? (await import("@/server/providers")).getDataRepository();
  const reminder = await repository.getReminder(parsed.userId, parsed.reminderId);

  if (!reminder) {
    return { status: "ignored", reminderId: parsed.reminderId, reason: "Reminder no longer exists." };
  }

  if (reminder.deliveryVersion !== parsed.deliveryVersion) {
    return { status: "ignored", reminderId: reminder.id, reason: "Stale delivery version." };
  }

  if (reminder.status !== "scheduled") {
    return { status: "ignored", reminderId: reminder.id, reason: `Reminder status is ${reminder.status}.` };
  }

  if (reminder.deliveryStatus === "sent" || reminder.deliveryStatus === "cancelled" || reminder.deliveryStatus === "skipped") {
    return { status: "ignored", reminderId: reminder.id, reason: `Delivery status is ${reminder.deliveryStatus}.` };
  }

  const now = options.now ?? new Date();
  const remindAt = new Date(reminder.remindAt);
  if (remindAt.getTime() - now.getTime() > EARLY_DELIVERY_TOLERANCE_MS) {
    return { status: "ignored", reminderId: reminder.id, reason: "Reminder is not due yet." };
  }

  const recipientEmail = reminder.deliveryRecipientEmail;
  if (!recipientEmail) {
    await repository.updateReminderDelivery(parsed.userId, parsed.reminderId, {
      deliveryStatus: "failed",
      lastAttemptAt: now.toISOString(),
      failureCount: reminder.failureCount + 1,
      lastError: "Reminder has no delivery email. Add a notification email in Settings or recreate the reminder.",
    });
    return { status: "retry", reminderId: reminder.id, reason: "Missing recipient email." };
  }

  await repository.updateReminderDelivery(parsed.userId, parsed.reminderId, {
    deliveryStatus: "sending",
    lastAttemptAt: now.toISOString(),
    lastError: null,
  });

  try {
    await (options.emailSender ?? sendReminderEmail)({ reminder, recipientEmail });
    await repository.updateReminderDelivery(parsed.userId, parsed.reminderId, {
      status: "sent",
      deliveryStatus: "sent",
      sentAt: new Date().toISOString(),
      lastError: null,
    });
    return { status: "sent", reminderId: reminder.id };
  } catch (error) {
    const reason = truncateDeliveryError(error);
    await repository.updateReminderDelivery(parsed.userId, parsed.reminderId, {
      deliveryStatus: error instanceof ReminderEmailConfigError ? "pending" : "failed",
      failureCount: reminder.failureCount + 1,
      lastError: reason,
    });
    return { status: "retry", reminderId: reminder.id, reason };
  }
}

export async function deliverDueReminders(limit = 25) {
  const repository = (await import("@/server/providers")).getDataRepository();
  const due = await repository.listDueReminders(new Date().toISOString(), limit);
  const results = [];

  for (const reminder of due) {
    results.push(await deliverReminder({
      reminderId: reminder.id,
      userId: reminder.userId ?? "",
      deliveryVersion: reminder.deliveryVersion,
    }));
  }

  return results;
}
