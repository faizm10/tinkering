import type { CurrentUser } from "@/lib/auth/session";

export interface AuthProvider {
  getCurrentUser(): Promise<CurrentUser | null>;
  requireCurrentUser(): Promise<CurrentUser>;
}
