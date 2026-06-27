import {
  DeleteProject,
  KeyRotation,
  OriginSettings,
} from "@/components/project-settings-actions";
import { GoogleAnalyticsSettings } from "@/components/google-analytics-settings";
import { InstallSnippet } from "@/components/install-snippet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth";
import { getGoogleAnalyticsConnection } from "@/lib/google-analytics-admin";
import { getProjectInstallSettings } from "@/lib/project-admin";

export default async function RepositorySettingsPage({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const endpoint = `${appUrl}/api/ingest`;
  const viewer = await requireViewer();
  const [googleAnalytics, installSettings] = await Promise.all([
    getGoogleAnalyticsConnection(viewer.id, repo),
    getProjectInstallSettings(viewer.id, repo),
  ]);

  const publicKeyPrefix = installSettings?.publicKeyPrefix ?? `rp_pub_${repo}`;
  const installSnippet = `<script src="${appUrl}/analytics.js"></script>
<script>
  RepoPulse.init({
    projectKey: "${publicKeyPrefix}",
    endpoint: "${endpoint}"
  })
</script>`;

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
          <GoogleAnalyticsSettings repository={repo} initialConnection={googleAnalytics} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Browser installation</CardTitle>
          <CardDescription>Add the SDK once, then call track for meaningful product actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {installSettings === null ? (
            <p className="text-sm text-muted-foreground">
              Enable analytics for this repository before installing the browser SDK.
            </p>
          ) : (
            <>
              <pre className="overflow-x-auto rounded-lg bg-secondary/60 p-4 font-mono text-xs leading-6 text-muted-foreground">
                {installSnippet}
              </pre>
              <InstallSnippet snippet={installSnippet} />
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Allowed origins</CardTitle>
          <CardDescription>Browser events are accepted only from these exact origins.</CardDescription>
        </CardHeader>
        <CardContent>
          <OriginSettings
            repository={repo}
            initialOrigins={installSettings?.allowedOrigins ?? []}
          />
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
