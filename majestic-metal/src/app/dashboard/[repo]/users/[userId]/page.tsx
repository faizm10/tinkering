import Link from "next/link";
import { ArrowLeft, CircleUserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvents, getUsers } from "@/lib/data";
import { formatDate, formatRelative } from "@/lib/utils";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ repo: string; userId: string }>;
}) {
  const { repo, userId } = await params;
  const [users, allEvents] = await Promise.all([getUsers(repo), getEvents(repo)]);
  const user = users.find((item) => item.id === userId) ?? users[0];
  const userEvents = allEvents.filter((event) => event.displayId === user?.displayId);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={`/dashboard/${repo}/users`}>
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
      </Button>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="p-6">
            <CircleUserRound className="size-10 text-muted-foreground" />
            <h2 className="mt-5 font-mono text-lg font-semibold">{user.displayId}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(user.traits).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
            <dl className="mt-7 space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">First seen</dt>
                <dd>{formatDate(user.firstSeenAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last active</dt>
                <dd>{formatRelative(user.lastSeenAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sessions</dt>
                <dd className="font-mono">{user.sessions}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Events</dt>
                <dd className="font-mono">{user.events}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {userEvents.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No recent raw events remain for this user.
                </p>
              )}
              {userEvents.map((event, index) => (
                <div key={event.id} className="relative flex gap-4 pb-7">
                  {index < userEvents.length - 1 && (
                    <span className="absolute left-[5px] top-4 h-full w-px bg-border" />
                  )}
                  <span className="relative mt-1.5 size-3 shrink-0 rounded-full border-2 border-primary bg-background" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-sm font-medium">{event.name}</p>
                      <time className="text-xs text-muted-foreground">{formatRelative(event.occurredAt)}</time>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{event.path ?? "Server event"}</p>
                    {Object.keys(event.properties).length > 0 && (
                      <pre className="mt-3 overflow-x-auto rounded-md bg-secondary/60 p-3 font-mono text-[11px] text-muted-foreground">
                        {JSON.stringify(event.properties, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
