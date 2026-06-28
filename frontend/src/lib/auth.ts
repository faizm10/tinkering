import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function requireViewer() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  return {
    id: userId,
    name: user?.fullName ?? user?.username ?? "GitHub user",
    imageUrl: user?.imageUrl ?? null,
  };
}
