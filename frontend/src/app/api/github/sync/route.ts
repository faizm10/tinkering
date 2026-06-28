import { auth } from "@clerk/nextjs/server";
import { hasDatabase } from "@/db";
import { getViewerGitHubLogin } from "@/lib/auth";
import { githubConfigured } from "@/lib/github";
import { syncInstallationsForGitHubLogin } from "@/lib/github-sync";
import { listUserRepositories } from "@/lib/project-admin";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (!hasDatabase() || !githubConfigured()) {
    return Response.json({ synced: false, repos: [] });
  }

  const githubLogin = await getViewerGitHubLogin();
  if (!githubLogin) {
    const repos = await listUserRepositories(userId);
    return Response.json({ synced: false, reason: "no_github_account", repos });
  }

  try {
    const result = await syncInstallationsForGitHubLogin(userId, githubLogin);
    const repos = await listUserRepositories(userId);
    return Response.json({ synced: true, linked: result.linked, repos });
  } catch (error) {
    console.error("github_identity_sync_failed", { userId, error });
    const repos = await listUserRepositories(userId);
    return Response.json({ synced: false, error: "sync_failed", repos }, { status: 200 });
  }
}
