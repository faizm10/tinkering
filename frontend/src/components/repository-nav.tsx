"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { RepositorySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const tabs = ["overview", "users", "events", "settings"] as const;

export function RepositoryNav({ repository }: { repository: RepositorySummary }) {
  const pathname = usePathname();
  const basePath = `/dashboard/${repository.slug}`;

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
        {tabs.map((tab) => {
          const href = `${basePath}/${tab}`;
          const active = pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
          return (
            <Link
              key={tab}
              href={href}
              className={cn(
                "border-b-2 pb-3 text-sm capitalize transition",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {tab}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
