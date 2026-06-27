import Link from "next/link";
import { ArrowRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SetupBanner({
  repoSlug,
  repositoryName,
}: {
  repoSlug: string;
  repositoryName: string;
}) {
  return (
    <div
      className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-5 py-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-amber-100/90">Finish setup for {repositoryName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Install the browser SDK or connect Google Analytics, PostHog, or Vercel to start
            receiving events. Until then, metrics stay at zero.
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href={`/dashboard/${repoSlug}/settings`}>
            <Settings className="size-4" />
            Open settings
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
