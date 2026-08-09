import "server-only";

import { approvalPayloadSchema } from "@/lib/validations/proposal";
import { requireUser } from "@/lib/auth/session";
import { getDataRepository } from "@/server/providers";

export async function approveProposal(proposalId: string, payload: unknown) {
  const user = await requireUser();
  const parsed = approvalPayloadSchema.parse(payload);
  return getDataRepository().approveProposal(user.id, proposalId, parsed.proposal);
}

export async function rejectProposal(proposalId: string) {
  const user = await requireUser();
  await getDataRepository().rejectProposal(user.id, proposalId);
}
