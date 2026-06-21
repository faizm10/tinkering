import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEvents } from "@/lib/data";
import { formatRelative } from "@/lib/utils";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  const events = await getEvents(repo);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Event stream</CardTitle>
          <CardDescription>Recent page views and custom events retained for 90 days.</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="size-4" />
          Filter
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Event</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead className="pr-5 text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="pl-5">
                  <Badge variant={event.name === "$pageview" ? "secondary" : "outline"} className="font-mono">
                    {event.name}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{event.displayId}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {event.path ?? "server"}
                </TableCell>
                <TableCell className="max-w-64 truncate font-mono text-[11px] text-muted-foreground">
                  {JSON.stringify(event.properties)}
                </TableCell>
                <TableCell className="pr-5 text-right text-muted-foreground">
                  {formatRelative(event.occurredAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
