import "server-only";

import { approvalPayloadSchema } from "@/lib/validations/proposal";
import { approveDemoProposal, rejectDemoProposal } from "@/server/services/demo-store";

export async function approveProposal(proposalId: string, payload: unknown) {
  const parsed = approvalPayloadSchema.parse(payload);
  return approveDemoProposal(proposalId, parsed.proposal);
}

export async function rejectProposal(proposalId: string) {
  rejectDemoProposal(proposalId);
}
