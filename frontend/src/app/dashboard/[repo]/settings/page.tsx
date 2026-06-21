import { Copy } from "lucide-react";
import {
  DeleteProject,
  KeyRotation,
  OriginSettings,
} from "@/components/project-settings-actions";
import { GoogleAnalyticsSettings } from "@/components/google-analytics-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth";
import { getGoogleAnalyticsConnection } from "@/lib/google-analytics-admin";

export default async function RepositorySettingsPage({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  const endpoint = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/ingest`;
  const viewer = await requireViewer();
  const googleAnalytics = await getGoogleAnalyticsConnection(viewer.id, repo);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Google Analytics</CardTitle>
          <CardDescription>
            Import GA4 users, sessions, page views, events, and acquisition data into this repository.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleAnalyticsSettings
            repository={repo}
            initialConnection={googleAnalytics}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Browser installation</CardTitle>
          <CardDescription>Add the SDK once, then call track for meaningful product actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="overflow-x-auto rounded-lg bg-secondary/60 p-4 font-mono text-xs leading-6 text-muted-foreground">
{`<script src="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/analytics.js"></script>
<script>
  RepoPulse.init({
    projectKey: "rp_pub_${repo}_••••••",
    endpoint: "${endpoint}"
  })
</script>`}
          </pre>
          <Button variant="outline" size="sm">
            <Copy className="size-4" />
            Copy snippet
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Allowed origins</CardTitle>
          <CardDescription>Browser events are accepted only from these exact origins.</CardDescription>
        </CardHeader>
        <CardContent>
          <OriginSettings repository={repo} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tracking keys</CardTitle>
          <CardDescription>Rotate a key if it is exposed. Old keys are revoked immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <KeyRotation repository={repo} />
        </CardContent>
      </Card>
      <Card className="border-destructive/35">
        <CardHeader>
          <CardTitle>Delete analytics data</CardTitle>
          <CardDescription>
            Permanently delete events, sessions, users, aggregates, and keys for this repository.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteProject repository={repo} />
        </CardContent>
      </Card>
    </div>
  );
}
