import { formatDueLabel, formatShortDate, isOverdue } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Dates are technical metadata, so they render in mono with a real <time>
 * element. Overdue dates get a word ("Overdue by 2 days") as well as colour —
 * never colour alone.
 */
export function DateDisplay({
  date,
  prefix,
  variant = "due",
  className,
}: {
  date: string;
  prefix?: string;
  variant?: "due" | "plain";
  className?: string;
}) {
  const overdue = variant === "due" && isOverdue(date);
  const label = variant === "due" ? formatDueLabel(date) : formatShortDate(date);

  return (
    <time
      dateTime={date}
      className={cn("type-mono", overdue ? "text-error" : "text-muted", className)}
    >
      {prefix ? `${prefix} ` : ""}
      {label}
    </time>
  );
}
