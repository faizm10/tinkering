import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventsTable } from "@/components/events-table";
import { getEvents, getRepository } from "@/lib/data";

export default async function EventsPage({ params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params;
  const [repository, events] = await Promise.all([getRepository(repo), getEvents(repo)]);
  const settingsHref =
    repository?.status !== "live" ? `/dashboard/${repo}/settings` : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
        <CardDescription>Recent product events with user, path, and property context.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <EventsTable events={events} settingsHref={settingsHref} />
      </CardContent>
    </Card>
  );
}
