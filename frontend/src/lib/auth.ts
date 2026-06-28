import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

function githubLoginFromUser(user: Awaited<ReturnType<typeof currentUser>>): string | null {
  const account = user?.externalAccounts?.find((external) =>
    external.provider?.toLowerCase().includes("github"),
  );
  return account?.username ?? null;
}

export async function requireViewer() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  return {
    id: userId,
    name: user?.fullName ?? user?.username ?? "GitHub user",
    imageUrl: user?.imageUrl ?? null,
    githubLogin: githubLoginFromUser(user),
  };
}

/** Returns the OAuth-verified GitHub login for the current user, or null. */
export async function getViewerGitHubLogin(): Promise<string | null> {
  const user = await currentUser();
  return githubLoginFromUser(user);
}
