import { format, parseISO } from "date-fns";

import type { ActivityRecord } from "@/server/services/types";

/**
 * Activity is a log, so the timestamp is mono and the action is a quiet
 * uppercase label. No icons — the sentence carries the meaning.
 */
export function ActivityItem({ item }: { item: ActivityRecord }) {
  const at = parseISO(item.createdAt);

  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-5">
      <time dateTime={item.createdAt} className="type-mono shrink-0 text-muted sm:w-36">
        {format(at, "MMM d, HH:mm")}
      </time>
      <div className="min-w-0">
        <p className="type-body text-ink">{item.description}</p>
        <p className="type-label mt-0.5">
          {item.action} · {item.entityType.replace(/_/g, " ")}
        </p>
      </div>
    </li>
  );
}
