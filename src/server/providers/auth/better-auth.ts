import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import type { CurrentUser } from "@/lib/auth/session";
import type { AuthProvider } from "@/server/providers/auth/provider";

export class BetterAuthProvider implements AuthProvider {
  async getCurrentUser(): Promise<CurrentUser | null> {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) return null;

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    };
  }

  async requireCurrentUser(): Promise<CurrentUser> {
    const user = await this.getCurrentUser();
    if (!user) redirect("/login");
    return user;
  }
}
