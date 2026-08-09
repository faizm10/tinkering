import "server-only";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import type { CurrentUser } from "@/lib/auth/session";
import type { AuthProvider } from "@/server/providers/auth/provider";

export const DEMO_USER_ID = "demo-user";

export class DemoAuthProvider implements AuthProvider {
  async getCurrentUser(): Promise<CurrentUser | null> {
    if (env.APP_MODE === "production") {
      throw new Error("Demo authentication is not available in production mode.");
    }

    return {
      id: DEMO_USER_ID,
      name: "Demo User",
      email: "demo@lifeadmin.local",
    };
  }

  async requireCurrentUser(): Promise<CurrentUser> {
    const user = await this.getCurrentUser();
    if (!user) redirect("/login");
    return user;
  }
}
