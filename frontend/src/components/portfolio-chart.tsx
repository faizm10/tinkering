import type { TrendPoint } from "@/lib/demo-data";
import { TrendChart } from "@/components/trend-chart";

export function PortfolioChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Activity trends appear once repositories have at least a few days of data.
      </p>
    );
  }

  return <TrendChart data={data} metric="users" gradientId="portfolio-trend-fill" />;
}
