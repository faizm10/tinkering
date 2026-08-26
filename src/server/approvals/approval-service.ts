import "server-only";

import { approvalPayloadSchema } from "@/lib/validations/proposal";
import { requireUser } from "@/lib/auth/session";
import { getDataRepository } from "@/server/providers";
import { scheduleReminderDelivery } from "@/server/reminders/scheduler";

export async function approveProposal(proposalId: string, payload: unknown) {
  const user = await requireUser();
  const parsed = approvalPayloadSchema.parse(payload);
  const repository = getDataRepository();
  const eventId = await repository.approveProposal(user.id, proposalId, parsed.proposal);
  const profile = await repository.getProfile(user.id);
  const reminders = await repository.listRemindersForEvent(user.id, eventId);
  await Promise.all(
    reminders.map((reminder) =>
      scheduleReminderDelivery(reminder, { recipientEmail: profile.notificationEmail ?? user.email }),
    ),
  );
  return eventId;
}

export async function rejectProposal(proposalId: string) {
  const user = await requireUser();
  await getDataRepository().rejectProposal(user.id, proposalId);
}
