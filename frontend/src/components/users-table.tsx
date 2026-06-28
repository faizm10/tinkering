"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollableTable } from "@/components/scrollable-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductUserSummary } from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/utils";

export function UsersTable({
  repo,
  users,
  settingsHref,
}: {
  repo: string;
  users: ProductUserSummary[];
  settingsHref?: string;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return users;
    return users.filter((user) => {
      const haystack = [
        user.displayId,
        user.id,
        ...Object.entries(user.traits).flatMap(([key, value]) => [key, String(value)]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, users]);

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search user ID or trait"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search users"
        />
      </div>
      <ScrollableTable>
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">User</TableHead>
            <TableHead>Traits</TableHead>
            <TableHead>First seen</TableHead>
            <TableHead>Last active</TableHead>
            <TableHead className="text-right">Sessions</TableHead>
            <TableHead className="text-right">Events</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {users.length === 0
                      ? "No users yet. Install the SDK or connect Google Analytics to start tracking visitors."
                      : "No users match your search."}
                  </p>
                  {users.length === 0 && settingsHref ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={settingsHref}>Open settings</Link>
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="pl-5 font-mono text-xs font-medium">{user.displayId}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(user.traits)
                      .slice(0, 2)
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(user.firstSeenAt)}</TableCell>
                <TableCell className="text-muted-foreground">{formatRelative(user.lastSeenAt)}</TableCell>
                <TableCell className="text-right font-mono">{user.sessions}</TableCell>
                <TableCell className="text-right font-mono">{user.events}</TableCell>
                <TableCell className="pr-5 text-right">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/dashboard/${repo}/users/${user.id}`} aria-label="View user timeline">
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
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
