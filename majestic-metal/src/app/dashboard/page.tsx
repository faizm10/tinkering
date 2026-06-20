import Link from "next/link";
import { Activity, ArrowRight, MousePointerClick, Users } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPortfolio } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const repositories = await getPortfolio();
  const totals = repositories.reduce(
    (sum, repository) => ({
      users: sum.users + repository.activeUsers,
      sessions: sum.sessions + repository.sessions,
      events: sum.events + repository.events,
    }),
    { users: 0, sessions: 0, events: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portfolio overview</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Product engagement</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/onboarding">Add repository</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Active users" value={totals.users} change={14.2} icon={Users} />
        <MetricCard label="Sessions" value={totals.sessions} change={11.8} icon={MousePointerClick} />
        <MetricCard label="Product events" value={totals.events} change={19.5} icon={Activity} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>Products connected through your GitHub App installations.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Repository</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {repositories.map((repository) => (
                <TableRow key={repository.id}>
                  <TableCell className="pl-5 font-medium">
                    {repository.fullName}
                    {repository.private && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">private</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={repository.status === "live" ? "success" : "outline"}>
                      {repository.analyticsSource === "google-analytics"
                        ? "GA4"
                        : repository.status === "live"
                          ? "Native"
                          : "Setup"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(repository.activeUsers)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(repository.sessions)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(repository.events)}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/dashboard/${repository.slug}/overview`} aria-label="Open repository">
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
