import { Activity, Eye, MousePointerClick, Users } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { TrendChart } from "@/components/trend-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventBreakdown, getRepository, getTrend } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  const [repository, trend, breakdown] = await Promise.all([
    getRepository(repo),
    getTrend(repo),
    getEventBreakdown(repo),
  ]);
  if (!repository) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active users" value={repository.activeUsers} change={18.4} icon={Users} />
        <MetricCard label="Sessions" value={repository.sessions} change={12.1} icon={MousePointerClick} />
        <MetricCard label="Events" value={repository.events} change={21.7} icon={Activity} />
        <MetricCard
          label="Page views"
          value={repository.pageviews ?? Math.round(repository.events * 0.56)}
          change={9.6}
          icon={Eye}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.65fr_0.85fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Active users</CardTitle>
              <CardDescription>Unique anonymous and identified visitors over 30 days.</CardDescription>
            </div>
            <p className="font-mono text-xl font-semibold">{formatNumber(repository.activeUsers)}</p>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top events</CardTitle>
            <CardDescription>Most common product actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {breakdown.topEvents.map((event) => (
              <div key={event.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-mono text-xs">{event.name}</span>
                  <span className="text-muted-foreground">{formatNumber(event.count)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${event.share}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Acquisition</CardTitle>
          <CardDescription>Top referrers for first sessions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {breakdown.referrers.map((referrer) => (
            <div key={referrer.name} className="rounded-lg border border-border bg-secondary/25 p-4">
              <p className="text-sm text-muted-foreground">{referrer.name}</p>
              <p className="mt-3 font-mono text-2xl font-semibold">{formatNumber(referrer.count)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
