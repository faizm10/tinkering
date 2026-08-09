import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { LifeEventProgress } from "@/components/events/life-event-progress";
import { EventStatus } from "@/components/life-admin/status-indicator";
import { formatDateRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { LifeEventSummary } from "@/server/services/types";

export function LifeEventCard({
  event,
  className,
}: {
  event: LifeEventSummary;
  className?: string;
}) {
  const remaining = event.totalTasks - event.completedTasks;

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "surface-card group/event flex flex-col gap-3.5 p-4 sm:p-5",
        "transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out)] hover:border-hairline-strong",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="type-card-title break-words">{event.title}</h3>
          <p className="type-mono text-muted">{formatDateRange(event.startDate, event.endDate)}</p>
        </div>
        <ArrowUpRight
          className="size-4 shrink-0 text-muted-soft transition-colors duration-[var(--dur-hover)] group-hover/event:text-ink"
          aria-hidden
        />
      </div>

      <LifeEventProgress completed={event.completedTasks} total={event.totalTasks} />

      <div className="space-y-1 border-t border-hairline-soft pt-3">
        <p className="type-label">Next</p>
        <p className="type-body text-ink">
          {event.nextTask
            ? event.nextTask.title
            : event.totalTasks === 0
              ? "No tasks yet"
              : "Nothing left to do"}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
        <EventStatus status={event.status} />
        <span className="type-meta">
          {event.totalTasks === 0
            ? "Nothing scheduled"
            : remaining === 0
              ? "All tasks done"
              : `${remaining} task${remaining === 1 ? "" : "s"} left`}
        </span>
        {event.waitingCount > 0 ? (
          <span className="type-meta">
            Waiting on {event.waitingCount} {event.waitingCount === 1 ? "reply" : "replies"}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
