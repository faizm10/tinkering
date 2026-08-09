import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Presentational copies of the real product rows.
 *
 * The authenticated components (`TaskRow`, `WaitingItem`) call APIs and need a
 * router, so they cannot render on a public page. These mirror their markup and
 * spacing exactly, which keeps the marketing screenshots honest: everything
 * shown here is reproducible in the app.
 */

export function AppFrame({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
        <span className="size-1.5 rounded-full bg-hairline-strong" aria-hidden />
        <span className="type-mono text-muted">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function FragmentLabel({ children }: { children: React.ReactNode }) {
  return <p className="type-label">{children}</p>;
}

export function TaskLine({
  title,
  due,
  done = false,
  priority,
  className,
}: {
  title: string;
  due?: string;
  done?: boolean;
  priority?: "high";
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 py-2.5", className)}>
      <span
        className={cn(
          "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border",
          done ? "border-ink bg-ink text-canvas" : "border-hairline-strong bg-surface",
        )}
        aria-hidden
      >
        {done ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <span
        className={cn(
          "type-card-title min-w-0 flex-1 break-words",
          done && "text-muted line-through decoration-muted-soft",
        )}
      >
        {title}
      </span>
      {priority === "high" && !done ? <span className="type-label shrink-0 text-ink">high</span> : null}
      {due ? <span className="type-mono shrink-0 text-muted">{due}</span> : null}
    </div>
  );
}

export function WaitingLine({
  duration,
  title,
  on,
  followUp,
  className,
}: {
  duration: string;
  title: string;
  on: string;
  followUp?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 py-3 sm:flex-row sm:gap-5", className)}>
      <div className="shrink-0 sm:w-24">
        <p className="type-mono text-[1.25rem] leading-tight text-ink">{duration}</p>
        <p className="type-label mt-0.5">Waiting</p>
      </div>
      <div className="min-w-0">
        <p className="type-card-title">{title}</p>
        <p className="type-meta mt-0.5">
          From {on}
          {followUp ? ` · Follow up ${followUp}` : ""}
        </p>
      </div>
    </div>
  );
}

export function EventLine({
  title,
  dates,
  done,
  total,
  next,
  className,
}: {
  title: string;
  dates: string;
  done: number;
  total: number;
  next: string;
  className?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className={cn("surface-card space-y-3 p-4", className)}>
      <div>
        <p className="type-card-title">{title}</p>
        <p className="type-mono text-muted">{dates}</p>
      </div>
      <div className="h-px w-full bg-hairline" aria-hidden>
        <div className="h-px bg-ink" style={{ width: `${percent}%` }} />
      </div>
      <p className="type-meta">
        {done} of {total} tasks done
      </p>
      <div className="border-t border-hairline-soft pt-2.5">
        <p className="type-label">Next</p>
        <p className="type-body mt-0.5 text-ink">{next}</p>
      </div>
    </div>
  );
}

/** The composer field as it appears in the app, with the user's words in it. */
export function ComposerLine({ input, className }: { input: string; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <FragmentLabel>What’s happening?</FragmentLabel>
      <div className="rounded-[var(--radius-control)] border border-hairline-strong bg-surface px-3 py-2.5">
        <p className="type-body text-ink">{input}</p>
      </div>
    </div>
  );
}
