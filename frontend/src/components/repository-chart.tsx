"use client";

import { useMemo, useState } from "react";
import type { TrendPoint } from "@/lib/types";
import { TrendChart, type TrendMetric } from "@/components/trend-chart";
import { Button } from "@/components/ui/button";

const metricOptions: { key: TrendMetric; label: string }[] = [
  { key: "users", label: "Users" },
  { key: "sessions", label: "Sessions" },
  { key: "events", label: "Events" },
  { key: "pageviews", label: "Page views" },
];

export function RepositoryChart({ data }: { data: TrendPoint[] }) {
  const hasPageviews = useMemo(
    () => data.some((point) => (point.pageviews ?? 0) > 0),
    [data],
  );
  const options = useMemo(
    () => metricOptions.filter((option) => option.key !== "pageviews" || hasPageviews),
    [hasPageviews],
  );
  const [metric, setMetric] = useState<TrendMetric>("users");

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Install the SDK or connect Google Analytics to start collecting daily metrics.
      </p>
    );
  }

  const activeMetric = options.some((option) => option.key === metric) ? metric : "users";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.key}
            type="button"
            size="sm"
            variant={activeMetric === option.key ? "default" : "outline"}
            onClick={() => setMetric(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <TrendChart data={data} metric={activeMetric} gradientId="repository-trend-fill" />
    </div>
  );
}
