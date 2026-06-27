import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersTable } from "@/components/users-table";
import { getRepository, getUsers } from "@/lib/data";

export default async function UsersPage({ params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params;
  const [repository, users] = await Promise.all([getRepository(repo), getUsers(repo)]);
  const settingsHref =
    repository?.status !== "live" ? `/dashboard/${repo}/settings` : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Identify returning users and inspect traits captured by the SDK.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsersTable repo={repo} users={users} settingsHref={settingsHref} />
      </CardContent>
    </Card>
  );
}
