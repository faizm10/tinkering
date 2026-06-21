import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUsers } from "@/lib/data";
import { formatDate, formatRelative } from "@/lib/utils";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  const users = await getUsers(repo);

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Product users</CardTitle>
          <CardDescription>Identified users and anonymous visitors ordered by recent activity.</CardDescription>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search user ID" />
        </div>
      </CardHeader>
      <CardContent className="px-0">
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
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="pl-5 font-mono text-xs font-medium">{user.displayId}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(user.traits)
                      .slice(0, 2)
                      .map(([key, value]) => (
                        <span key={key} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
