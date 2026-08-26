import "server-only";

import { Client } from "@upstash/qstash";

import { env, hasReminderDelivery } from "@/lib/env";
import { getDataRepository } from "@/server/providers";
import type { ReminderRecord } from "@/server/services/types";
import {
  normalizeBaseUrl,
  REMINDER_DELIVERY_CONFIG_MESSAGE,
  REMINDER_DELIVERY_ENDPOINT,
  type ReminderDeliveryPayload,
  truncateDeliveryError,
} from "@/server/reminders/types";

const MAX_QSTASH_DELAY_MS = 365 * 24 * 60 * 60 * 1000;

export type ReminderScheduleResult =
  | { status: "scheduled"; messageId: string }
  | { status: "pending"; reason: string }
  | { status: "ignored"; reason: string };

function deliveryUrl() {
  return `${normalizeBaseUrl(env.APP_BASE_URL ?? "")}${REMINDER_DELIVERY_ENDPOINT}`;
}

function buildPayload(reminder: ReminderRecord): ReminderDeliveryPayload {
  return {
    reminderId: reminder.id,
    userId: reminder.userId ?? "",
    deliveryVersion: reminder.deliveryVersion,
  };
}

export async function scheduleReminderDelivery(
  reminder: ReminderRecord,
  options: { recipientEmail?: string | null } = {},
): Promise<ReminderScheduleResult> {
  if (!reminder.userId) {
    return { status: "ignored", reason: "Reminder has no user id." };
  }

  if (reminder.status !== "scheduled") {
    return { status: "ignored", reason: `Reminder status is ${reminder.status}.` };
  }

  const repository = getDataRepository();
  const recipientEmail = options.recipientEmail ?? reminder.deliveryRecipientEmail ?? null;
  const now = new Date();
  const remindAt = new Date(reminder.remindAt);

  if (!Number.isFinite(remindAt.getTime())) {
    await repository.updateReminderDelivery(reminder.userId, reminder.id, {
      deliveryStatus: "failed",
      deliveryRecipientEmail: recipientEmail,
      lastError: "Reminder has an invalid remindAt timestamp.",
    });
    return { status: "pending", reason: "Invalid remindAt timestamp." };
  }

  await repository.updateReminderDelivery(reminder.userId, reminder.id, {
    deliveryStatus: "pending",
    deliveryRecipientEmail: recipientEmail,
    lastError: null,
  });

  if (!hasReminderDelivery()) {
    await repository.updateReminderDelivery(reminder.userId, reminder.id, {
      deliveryStatus: "pending",
      deliveryRecipientEmail: recipientEmail,
      lastError: REMINDER_DELIVERY_CONFIG_MESSAGE,
    });
    return { status: "pending", reason: REMINDER_DELIVERY_CONFIG_MESSAGE };
  }

  if (remindAt.getTime() - now.getTime() > MAX_QSTASH_DELAY_MS) {
    const reason = "Reminder is outside QStash's one-year scheduling window and will be queued by the cron sweep later.";
    await repository.updateReminderDelivery(reminder.userId, reminder.id, {
      deliveryStatus: "pending",
      deliveryRecipientEmail: recipientEmail,
      lastError: reason,
    });
    return { status: "pending", reason };
  }

  try {
    const qstash = new Client({ token: env.QSTASH_TOKEN });
    const response = await qstash.publishJSON({
      url: deliveryUrl(),
      body: buildPayload(reminder),
      method: "POST",
      notBefore: Math.max(Math.floor(remindAt.getTime() / 1000), Math.floor(Date.now() / 1000)),
      deduplicationId: `reminder:${reminder.id}:v${reminder.deliveryVersion}`,
      retries: 3,
      retryDelay: "1000 * pow(2, retried)",
      label: ["sonae", "reminder"],
      headers: env.CRON_SECRET ? { Authorization: `Bearer ${env.CRON_SECRET}` } : undefined,
    });

    await repository.updateReminderDelivery(reminder.userId, reminder.id, {
      deliveryStatus: "scheduled",
      deliveryRecipientEmail: recipientEmail,
      qstashMessageId: response.messageId,
      scheduledAt: new Date().toISOString(),
      lastError: null,
    });

    return { status: "scheduled", messageId: response.messageId };
  } catch (error) {
    const reason = truncateDeliveryError(error);
    await repository.updateReminderDelivery(reminder.userId, reminder.id, {
      deliveryStatus: "pending",
      deliveryRecipientEmail: recipientEmail,
      lastError: reason,
    });
    return { status: "pending", reason };
  }
}

export async function queueUpcomingReminders(limit = 50) {
  const repository = getDataRepository();
  const now = Date.now();
  const scheduleWindowIso = new Date(now + MAX_QSTASH_DELAY_MS).toISOString();
  const due = await repository.listDueReminders(scheduleWindowIso, limit);
  const results = [];

  for (const reminder of due) {
    if (reminder.deliveryStatus === "pending" || reminder.deliveryStatus === "failed") {
      results.push(await scheduleReminderDelivery(reminder));
    }
  }

  return results;
}
