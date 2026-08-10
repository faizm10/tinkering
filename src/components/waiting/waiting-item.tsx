"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { daysUntil, formatElapsed, formatShortDate, isOverdue } from "@/lib/dates";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { WaitingItemRecord } from "@/server/services/types";

/**
 * Waiting On earns its distinction from layout, not a second brand colour:
 * the elapsed time is set large in mono on the left, and the obligation reads
 * as a sentence on the right.
 */
export function WaitingItem({ item, actions }: { item: WaitingItemRecord; actions?: ReactNode }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [, startTransition] = useTransition();
  const [resolved, setResolved] = useState(item.status === "resolved");
  const [error, setError] = useState("");

  function resolve() {
    setResolved(true);
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/waiting/${item.id}/resolve`, { method: "POST" });
      if (!response.ok) {
        setResolved(false);
        setError("Could not resolve this item.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <motion.li
      layout={!reduceMotion}
      transition={transition.layout}
      className="group/waiting flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:gap-6"
    >
      <div className="shrink-0 sm:w-28">
        <p className="type-mono text-[1.25rem] leading-tight text-ink">
          {formatElapsed(item.createdAt)}
        </p>
        <p className="type-label mt-0.5">Waiting</p>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className={cn("type-card-title", resolved && "text-muted line-through")}>
          {item.title}
        </h3>
        <p className="type-body mt-0.5 text-body">
          From <span className="text-ink">{item.waitingOn}</span>
          {item.description ? ` — ${item.description}` : ""}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {item.expectedBy ? (
            <span className="type-meta">
              Expected{" "}
              <time dateTime={item.expectedBy} className="type-mono text-body">
                {formatShortDate(item.expectedBy)}
              </time>
            </span>
          ) : (
            <span className="type-meta">No expected date</span>
          )}
          {item.followUpDate ? <FollowUp date={item.followUpDate} /> : null}
        </div>

        {error ? (
          <p role="alert" className="mt-1.5 text-[0.8125rem] text-error">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:opacity-0 sm:transition-opacity sm:duration-[var(--dur-hover)] sm:group-hover/waiting:opacity-100 sm:group-focus-within/waiting:opacity-100">
        <Button variant="secondary" size="sm" onClick={resolve} disabled={resolved}>
          {resolved ? "Resolved" : "Resolve"}
        </Button>
        {actions}
      </div>
    </motion.li>
  );
}

/** "Follow up tomorrow" / "Follow-up overdue by 2 days" — words, then colour. */
function FollowUp({ date }: { date: string }) {
  const days = daysUntil(date);
  const overdue = isOverdue(date);

  const label =
    days === 0
      ? "Follow up today"
      : days === 1
        ? "Follow up tomorrow"
        : overdue
          ? `Follow-up overdue by ${Math.abs(days)} days`
          : `Follow up ${formatShortDate(date)}`;

  return (
    <time
      dateTime={date}
      className={cn("text-[0.8125rem]", overdue || days === 0 ? "text-error" : "text-muted")}
    >
      {label}
    </time>
  );
}
