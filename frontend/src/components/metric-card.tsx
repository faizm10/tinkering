import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: number;
  change?: number;
  icon: LucideIcon;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="font-mono text-2xl font-semibold tracking-tight">{formatNumber(value)}</p>
          {change !== undefined ? (
            <span
              className={
                positive
                  ? "flex flex-col items-end text-xs text-emerald-400"
                  : "flex flex-col items-end text-xs text-rose-400"
              }
            >
              <span className="flex items-center">
                {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted-foreground">vs prior 7d</span>
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
