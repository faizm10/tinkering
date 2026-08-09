import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { hasDatabase } from "@/lib/env";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!hasDatabase()) {
    return {
      id: "demo-user",
      name: "Faiz",
      email: "demo@lifeadmin.local",
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
