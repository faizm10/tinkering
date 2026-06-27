import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserTimeline, getUsers } from "@/lib/data";
import { formatDate, formatRelative } from "@/lib/utils";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ repo: string; userId: string }>;
}) {
  const { repo, userId } = await params;
  const users = await getUsers(repo);
  const user = users.find((entry) => entry.id === userId);

  if (!user) notFound();

  const timeline = await getUserTimeline(repo, user.id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground">
        <Link href={`/dashboard/${repo}/users`}>
          <ArrowLeft className="size-4" />
          All users
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg">{user.displayId}</CardTitle>
          <CardDescription>
            First seen {formatDate(user.firstSeenAt)} · Last active {formatRelative(user.lastSeenAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(user.traits).map(([key, value]) => (
            <Badge key={key} variant="secondary">
              {key}: {String(value)}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Recent events for this user.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded for this user yet.</p>
          ) : (
            timeline.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm">{event.name}</p>
                  <p className="text-xs text-muted-foreground">{event.path ?? "server"}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatRelative(event.occurredAt)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
