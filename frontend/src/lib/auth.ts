import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export async function requireViewer() {
  if (!clerkConfigured) {
    return {
      id: "demo-user",
      name: "Demo workspace",
      imageUrl: null,
      isDemo: true,
    };
  }

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  return {
    id: userId,
    name: user?.fullName ?? user?.username ?? "GitHub user",
    imageUrl: user?.imageUrl ?? null,
    isDemo: false,
  };
}
