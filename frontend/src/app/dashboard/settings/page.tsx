import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkspaceSettingsPage() {
  const checks = [
    ["Clerk authentication", Boolean(process.env.CLERK_SECRET_KEY)],
    ["Neon Postgres", Boolean(process.env.DATABASE_URL)],
    ["Upstash rate limiting", Boolean(process.env.UPSTASH_REDIS_REST_URL)],
    ["GitHub App", Boolean(process.env.GITHUB_APP_ID)],
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Workspace settings</h1>
      <p className="mt-2 text-muted-foreground">Deployment and integration readiness.</p>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Infrastructure</CardTitle>
          <CardDescription>
            Demo mode remains available until all production integrations are configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {checks.map(([label, ready]) => (
            <div key={String(label)} className="flex items-center justify-between py-4">
              <span className="text-sm">{String(label)}</span>
              <span className={ready ? "text-xs text-emerald-400" : "text-xs text-amber-400"}>
                {ready ? "Connected" : "Needs configuration"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
