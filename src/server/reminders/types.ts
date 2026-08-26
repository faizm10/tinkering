import { z } from "zod";

export const reminderDeliveryPayloadSchema = z.object({
  reminderId: z.string().min(1),
  userId: z.string().min(1),
  deliveryVersion: z.number().int().min(1),
});

export type ReminderDeliveryPayload = z.infer<typeof reminderDeliveryPayloadSchema>;

export const REMINDER_DELIVERY_ENDPOINT = "/api/reminders/deliver";

export const REMINDER_DELIVERY_CONFIG_MESSAGE =
  "Reminder delivery is waiting for APP_BASE_URL, QSTASH_TOKEN, RESEND_API_KEY, and RESEND_FROM_EMAIL.";

export function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function truncateDeliveryError(error: unknown) {
  const message = error instanceof Error ? error.message : "Reminder delivery failed.";
  return message.slice(0, 500);
}
