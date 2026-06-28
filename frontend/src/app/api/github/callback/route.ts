import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { hasDatabase } from "@/db";
import { ensureDashboardAccount, syncInstallation } from "@/lib/github-sync";
import { verifyGitHubInstallState } from "@/lib/github-state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const installationId = Number(url.searchParams.get("installation_id"));
  if (!Number.isSafeInteger(installationId)) {
    return Response.json({ error: "missing_installation_id" }, { status: 400 });
  }
  if (!hasDatabase()) {
    return Response.redirect(new URL("/dashboard/onboarding?error=database_not_configured", request.url));
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.redirect(new URL(`/sign-in?redirect_url=${encodeURIComponent(url.pathname + url.search)}`, request.url));
  }

  try {
    const state = url.searchParams.get("state");
    const cookieStore = await cookies();
    const storedState = cookieStore.get("github_install_state")?.value;
    if (!state || !storedState || state !== storedState || !verifyGitHubInstallState(state, userId)) {
      return Response.redirect(new URL("/dashboard/onboarding?error=invalid_installation_state", request.url));
    }
    cookieStore.delete("github_install_state");

    const account = await ensureDashboardAccount(userId);
    await syncInstallation(account.id, installationId);
    return Response.redirect(new URL("/dashboard/onboarding?installation=connected", request.url));
  } catch (error) {
    console.error("github_installation_callback_failed", { installationId, error });
    return Response.redirect(new URL("/dashboard/onboarding?error=github_sync_failed", request.url));
  }
}
