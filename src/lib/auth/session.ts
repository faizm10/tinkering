import "server-only";

import { getAuthProvider } from "@/server/providers";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return getAuthProvider().getCurrentUser();
}

export async function requireUser() {
  return getAuthProvider().requireCurrentUser();
}
