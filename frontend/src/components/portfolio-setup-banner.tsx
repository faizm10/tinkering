import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RepositorySummary } from "@/lib/demo-data";

export function PortfolioSetupBanner({ repositories }: { repositories: RepositorySummary[] }) {
  const setupRepos = repositories.filter((repo) => repo.status !== "live");
  if (setupRepos.length === 0) {
    return null;
  }

  const allNeedSetup = setupRepos.length === repositories.length;
  const firstSlug = setupRepos[0]?.slug;

  return (
    <div
      className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-5 py-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
            <Radio className="size-4 text-amber-300" />
          </span>
          <div>
            <p className="font-medium text-amber-100/90">
              {allNeedSetup
                ? "No repositories are sending events yet"
                : `${setupRepos.length} ${setupRepos.length === 1 ? "repository needs" : "repositories need"} setup`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {allNeedSetup
                ? "Install the browser SDK or connect GA4, PostHog, or Vercel Analytics so dashboards show live metrics."
                : "Open repository settings to finish SDK install or connect an analytics source."}
            </p>
          </div>
        </div>
        {firstSlug ? (
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href={`/dashboard/${firstSlug}/settings`}>
              {allNeedSetup ? "Finish setup" : "Open settings"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
