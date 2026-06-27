import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity, BarChart3, Eye, Users } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { MetricsPeriodNote } from "@/components/metrics-period-note";
import { RepositoryChart } from "@/components/repository-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventBreakdown, getRepository, getTrend } from "@/lib/data";
import { computePeriodChange } from "@/lib/metrics";
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

  if (!repository) notFound();

  const userChange = computePeriodChange(trend, "users");
  const sessionChange = computePeriodChange(trend, "sessions");
  const eventChange = computePeriodChange(trend, "events");
  const showPageviews =
    repository.analyticsSource === "google-analytics" || repository.pageviews !== undefined;
  const pageviewChange = showPageviews ? computePeriodChange(trend, "pageviews") : undefined;

  const metricChanges = [userChange, sessionChange, eventChange, pageviewChange];
  const settingsHref = repository.status !== "live" ? `/dashboard/${repo}/settings` : undefined;

  return (
    <div className="space-y-6">
      <div
        className={`grid gap-4 md:grid-cols-2 ${showPageviews ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
      >
        <MetricCard label="Users" value={repository.activeUsers} change={userChange} icon={Users} />
        <MetricCard label="Sessions" value={repository.sessions} change={sessionChange} icon={Activity} />
        <MetricCard label="Events" value={repository.events} change={eventChange} icon={BarChart3} />
        {showPageviews ? (
          <MetricCard
            label="Page views"
            value={repository.pageviews ?? 0}
            change={pageviewChange}
            icon={Eye}
          />
        ) : null}
      </div>

      <MetricsPeriodNote trend={trend} changes={metricChanges} />

      <Card>
        <CardHeader>
          <CardTitle>Usage trend</CardTitle>
          <CardDescription>Daily users, sessions, and events for the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <RepositoryChart data={trend} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top events</CardTitle>
            <CardDescription>Most frequent event names in the retention window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {breakdown.topEvents.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No events yet. Install the SDK or connect Google Analytics to populate this chart.
                </p>
                {settingsHref ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={settingsHref}>Open settings</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              breakdown.topEvents.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate font-mono">{item.name}</span>
                  <span className="font-mono text-muted-foreground">{formatNumber(item.count)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top referrers</CardTitle>
            <CardDescription>Where sessions originated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {breakdown.referrers.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Referrer data appears once browser sessions include a referrer URL.
                </p>
                {settingsHref ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={settingsHref}>Open settings</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              breakdown.referrers.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="font-mono text-muted-foreground">{formatNumber(item.count)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
