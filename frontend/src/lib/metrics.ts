import type { TrendPoint } from "./types";

type TrendMetric = "users" | "sessions" | "events" | "pageviews";

function sumMetric(points: TrendPoint[], key: TrendMetric) {
  return points.reduce((total, point) => total + (point[key] ?? 0), 0);
}

/** Compare the last N days to the prior N days. Returns undefined when history is too short. */
export function computePeriodChange(
  trend: TrendPoint[],
  metric: TrendMetric,
  periodDays = 7,
): number | undefined {
  const minimum = periodDays * 2;
  if (trend.length < minimum) return undefined;

  const recent = trend.slice(-periodDays);
  const previous = trend.slice(-periodDays * 2, -periodDays);
  const recentTotal = sumMetric(recent, metric);
  const previousTotal = sumMetric(previous, metric);

  if (previousTotal === 0) {
    return recentTotal > 0 ? 100 : undefined;
  }

  return ((recentTotal - previousTotal) / previousTotal) * 100;
}
