import "server-only";

import { requireUser } from "@/lib/auth/session";
import { getDataRepository } from "@/server/providers";

export async function setTaskCompleted(taskId: string, completed: boolean) {
  const user = await requireUser();
  return getDataRepository().setTaskCompleted(user.id, taskId, completed);
}
