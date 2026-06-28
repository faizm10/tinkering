"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EventSummary } from "@/lib/types";
import { formatRelative } from "@/lib/utils";
import { ScrollableTable } from "@/components/scrollable-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EventsTable({
  events,
  settingsHref,
}: {
  events: EventSummary[];
  settingsHref?: string;
}) {
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return events;
    return events.filter((event) => {
      const haystack = [
        event.name,
        event.displayId,
        event.path ?? "",
        JSON.stringify(event.properties),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [events, normalizedQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={showFilter ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilter((open) => !open)}
        >
          <Filter className="size-4" />
          Filter
        </Button>
      </div>
      {showFilter ? (
        <Input
          placeholder="Filter by event, user, path, or property"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Filter events"
        />
      ) : null}
      <ScrollableTable>
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
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {events.length === 0
                      ? "No events recorded yet. Send your first event from the browser SDK or import GA4 data."
                      : "No events match this filter."}
                  </p>
                  {events.length === 0 && settingsHref ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={settingsHref}>Open settings</Link>
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((event) => (
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
            ))
          )}
        </TableBody>
      </Table>
      </ScrollableTable>
    </div>
  );
}
