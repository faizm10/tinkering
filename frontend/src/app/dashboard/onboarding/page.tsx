import { hasDatabase } from "@/db";
import { requireViewer } from "@/lib/auth";
import { githubConfigured } from "@/lib/github";
import { syncInstallationsForGitHubLogin } from "@/lib/github-sync";
import { listUserRepositories } from "@/lib/project-admin";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const viewer = await requireViewer();
  const workspaceMode: "live" | "needs-db" = !hasDatabase() ? "needs-db" : "live";
  let repos = workspaceMode === "live" ? await listUserRepositories(viewer.id) : [];

  // Auto-link any GitHub App installation that belongs to this user's verified
  // GitHub identity. This makes a direct install (from GitHub settings) show up
  // without requiring the in-app callback flow.
  if (workspaceMode === "live" && repos.length === 0 && githubConfigured() && viewer.githubLogin) {
    try {
      await syncInstallationsForGitHubLogin(viewer.id, viewer.githubLogin);
      repos = await listUserRepositories(viewer.id);
    } catch (error) {
      console.error("onboarding_auto_sync_failed", { userId: viewer.id, error });
    }
  }

  const installUrl = process.env.GITHUB_APP_SLUG
    ? "/api/github/install"
    : "https://github.com/settings/apps/new";

  return (
    <OnboardingWizard
      repos={repos}
      installUrl={installUrl}
      initialError={params.error ?? null}
      initiallyConnected={params.installation === "connected"}
      workspaceMode={workspaceMode}
    />
  );
}
