import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowRight, BarChart3, Users } from "lucide-react";
import { DemoWorkspaceCallout } from "@/components/demo-workspace-callout";
import { MetricCard } from "@/components/metric-card";
import { PortfolioSetupBanner } from "@/components/portfolio-setup-banner";
import { MetricsPeriodNote } from "@/components/metrics-period-note";
import { ScrollableTable } from "@/components/scrollable-table";
import { PortfolioChart } from "@/components/portfolio-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireViewer } from "@/lib/auth";
import { getPortfolio, getPortfolioTrend } from "@/lib/data";
import { computePeriodChange } from "@/lib/metrics";
import { formatNumber, formatRelative } from "@/lib/utils";

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const [repositories, trend] = await Promise.all([getPortfolio(), getPortfolioTrend()]);

  if (!viewer.isDemo && repositories.length === 0) {
    redirect("/dashboard/onboarding");
  }
  const totals = repositories.reduce(
    (acc, repo) => ({
      users: acc.users + repo.activeUsers,
      sessions: acc.sessions + repo.sessions,
      events: acc.events + repo.events,
    }),
    { users: 0, sessions: 0, events: 0 },
  );

  const userChange = computePeriodChange(trend, "users");
  const sessionChange = computePeriodChange(trend, "sessions");
  const eventChange = computePeriodChange(trend, "events");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Portfolio</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Product analytics</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {viewer.isDemo
              ? "Explore the demo workspace with sample repositories and metrics."
              : "Track users, sessions, and events across every connected repository."}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/onboarding">
            Add repository
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {viewer.isDemo ? <DemoWorkspaceCallout /> : null}

      {repositories.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No repositories yet</CardTitle>
            <CardDescription>
              Connect a GitHub repository and install the browser SDK, or import Google Analytics data
              to see product metrics here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/onboarding">Get started</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {!viewer.isDemo ? <PortfolioSetupBanner repositories={repositories} /> : null}

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Users" value={totals.users} change={userChange} icon={Users} />
            <MetricCard label="Sessions" value={totals.sessions} change={sessionChange} icon={Activity} />
            <MetricCard label="Events" value={totals.events} change={eventChange} icon={BarChart3} />
          </div>

          <MetricsPeriodNote
            trend={trend}
            changes={[userChange, sessionChange, eventChange]}
          />

          <Card>
            <CardHeader>
              <CardTitle>Activity trend</CardTitle>
              <CardDescription>Daily users across selected repositories.</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioChart data={trend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Repositories</CardTitle>
              <CardDescription>Open a repository to inspect users, events, and settings.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <ScrollableTable>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Repository</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="pr-5 text-right">Last event</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repositories.map((repo) => (
                    <TableRow key={repo.slug}>
                      <TableCell className="pl-5">
                        <Link
                          href={`/dashboard/${repo.slug}/overview`}
                          className="font-medium hover:underline"
                        >
                          {repo.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={repo.status === "live" ? "success" : "outline"}>
                          {repo.analyticsSource === "google-analytics"
                            ? "GA4"
                            : repo.status === "live"
                              ? "Live"
                              : "Setup"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(repo.activeUsers)}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(repo.sessions)}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(repo.events)}</TableCell>
                      <TableCell className="pr-5 text-right text-muted-foreground">
                        {repo.lastEventAt ? formatRelative(repo.lastEventAt) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </ScrollableTable>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
