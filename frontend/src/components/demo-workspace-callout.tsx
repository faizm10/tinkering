import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clerkConfigured } from "@/lib/auth";

export function DemoWorkspaceCallout() {
  return (
    <div
      className="rounded-xl border border-sky-500/25 bg-sky-500/5 px-5 py-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10">
            <FlaskConical className="size-4 text-sky-300" />
          </span>
          <div>
            <p className="font-medium text-sky-100/90">You&apos;re viewing sample data</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Metrics, users, and events are illustrative. Try{" "}
              <Link href="/dashboard/aurora/overview" className="text-foreground underline-offset-4 hover:underline">
                aurora
              </Link>{" "}
              for a live demo repo, or{" "}
              <Link href="/dashboard/launchpad/overview" className="text-foreground underline-offset-4 hover:underline">
                launchpad
              </Link>{" "}
              to see what setup looks like before data arrives. Connect your GitHub repositories and
              analytics sources to see real product activity.
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href={clerkConfigured ? "/sign-up" : "/dashboard/settings"}>
            {clerkConfigured ? "Create account" : "Production setup"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
