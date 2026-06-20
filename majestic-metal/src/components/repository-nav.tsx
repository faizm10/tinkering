import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { RepositorySummary } from "@/lib/demo-data";

const tabs = ["overview", "users", "events", "settings"] as const;

export function RepositoryNav({ repository }: { repository: RepositorySummary }) {
  return (
    <div className="mb-6 border-b border-border">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Repository</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{repository.fullName}</h1>
        </div>
        <Badge variant={repository.status === "live" ? "success" : "outline"}>
          {repository.analyticsSource === "google-analytics"
            ? "Google Analytics"
            : repository.status === "live"
              ? "RepoPulse analytics"
              : "Setup required"}
        </Badge>
      </div>
      <nav className="-mb-px flex gap-5 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/dashboard/${repository.slug}/${tab}`}
            className="border-b-2 border-transparent pb-3 text-sm capitalize text-muted-foreground transition hover:border-muted-foreground hover:text-foreground"
          >
            {tab}
          </Link>
        ))}
      </nav>
    </div>
  );
}
