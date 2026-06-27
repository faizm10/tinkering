import type { TrendPoint } from "@/lib/demo-data";

/** Shown when trend data exists but there isn't enough history for week-over-week % change. */
export function MetricsPeriodNote({
  trend,
  changes,
}: {
  trend: TrendPoint[];
  changes: Array<number | undefined>;
}) {
  const hasAnyChange = changes.some((change) => change !== undefined);
  if (hasAnyChange || trend.length === 0) return null;

  return (
    <p className="text-xs text-muted-foreground">
      Percent changes compare the last 7 days to the prior 7 and appear once you have at least 14
      days of history.
    </p>
  );
}
