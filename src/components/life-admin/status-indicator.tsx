import { cn } from "@/lib/utils";

/**
 * Status is carried by a word plus a small mark — never by colour alone, and
 * never by the agent pastels, which belong to the agent timeline only.
 * The palette here is limited to ink, muted, success and error.
 */
type Tone = "neutral" | "active" | "success" | "attention";

const toneDot: Record<Tone, string> = {
  neutral: "bg-muted-soft",
  active: "bg-ink",
  success: "bg-success",
  attention: "bg-error",
};

export function StatusIndicator({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[0.8125rem] text-body", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", toneDot[tone])} aria-hidden />
      {label}
    </span>
  );
}

const eventTone: Record<string, Tone> = {
  active: "active",
  completed: "success",
  draft: "neutral",
  archived: "neutral",
};

export function EventStatus({ status, className }: { status: string; className?: string }) {
  return (
    <StatusIndicator
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      tone={eventTone[status] ?? "neutral"}
      className={className}
    />
  );
}

/**
 * Priority is typographic. High gets ink and weight, medium is quiet, low is
 * quieter still — no red/amber/green badge wall.
 */
export function PriorityLabel({
  priority,
  className,
}: {
  priority: "low" | "medium" | "high";
  className?: string;
}) {
  if (priority === "medium") return null;

  return (
    <span
      className={cn(
        "type-label shrink-0",
        priority === "high" ? "text-ink" : "text-muted-soft",
        className,
      )}
    >
      {priority}
    </span>
  );
}

/** Small uppercase tag on the surface-strong pill from design.md. */
export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "type-label inline-flex items-center rounded-[var(--radius-tag)] bg-surface-strong px-1.5 py-0.5 text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
