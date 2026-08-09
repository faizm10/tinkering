import { cn } from "@/lib/utils";

/**
 * A single restrained rule, not a donut chart. The number is spelled out next
 * to it so progress never depends on reading a bar.
 */
export function LifeEventProgress({
  completed,
  total,
  className,
}: {
  completed: number;
  total: number;
  className?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tasks completed"
        className="h-px w-full bg-hairline"
      >
        <div
          className="h-px bg-ink transition-[width] duration-[var(--dur-panel)] ease-[var(--ease-out)] motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="type-meta">
        {total === 0 ? "No tasks yet" : `${completed} of ${total} tasks done`}
      </p>
    </div>
  );
}
