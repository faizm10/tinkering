import "server-only";

import { requireUser } from "@/lib/auth/session";
import { getDataRepository } from "@/server/providers";

export async function resolveWaitingItem(waitingId: string) {
  const user = await requireUser();
  return getDataRepository().resolveWaitingItem(user.id, waitingId);
}
