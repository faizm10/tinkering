import "server-only";

import { Resend } from "resend";

import { env } from "@/lib/env";
import type { ReminderRecord } from "@/server/services/types";

export class ReminderEmailConfigError extends Error {
  constructor() {
    super("Reminder email is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL.");
    this.name = "ReminderEmailConfigError";
  }
}

export type ReminderEmailSender = (input: {
  reminder: ReminderRecord;
  recipientEmail: string;
}) => Promise<void>;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatReminderTime(reminder: ReminderRecord) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(new Date(reminder.remindAt));
}

export const sendReminderEmail: ReminderEmailSender = async ({ reminder, recipientEmail }) => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    throw new ReminderEmailConfigError();
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const title = escapeHtml(reminder.title);
  const scheduledFor = escapeHtml(formatReminderTime(reminder));

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: recipientEmail,
    subject: `Reminder: ${reminder.title}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#171717;max-width:560px">
        <p style="font-size:13px;color:#737373;margin:0 0 12px">Sonae reminder</p>
        <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px">${title}</h1>
        <p style="margin:0 0 18px">This was scheduled for ${scheduledFor}.</p>
        <p style="font-size:13px;color:#737373;margin:0">You can edit or dismiss reminders from your Sonae dashboard.</p>
      </div>
    `,
    text: `Sonae reminder: ${reminder.title}\nScheduled for ${formatReminderTime(reminder)}.`,
  });
};
