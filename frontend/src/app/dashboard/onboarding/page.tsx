import { hasDatabase } from "@/db";
import { requireViewer } from "@/lib/auth";
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
  const repos = workspaceMode === "live" ? await listUserRepositories(viewer.id) : [];

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
