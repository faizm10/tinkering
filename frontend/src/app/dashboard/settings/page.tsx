import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CheckItem = {
  label: string;
  ready: boolean;
  envVars: string[];
  help: string;
  href?: string;
};

export default function WorkspaceSettingsPage() {
  const checks: CheckItem[] = [
    {
      label: "Clerk authentication",
      ready: Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
      envVars: ["CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"],
      help: "Enables sign-in, per-user workspaces, and production onboarding.",
      href: "https://clerk.com/docs/quickstarts/nextjs",
    },
    {
      label: "Neon Postgres",
      ready: Boolean(process.env.DATABASE_URL),
      envVars: ["DATABASE_URL"],
      help: "Stores repositories, events, users, and integration credentials.",
      href: "https://neon.tech/docs/connect/connect-from-any-app",
    },
    {
      label: "Upstash rate limiting",
      ready: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      envVars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      help: "Protects the ingest API from abuse in production.",
      href: "https://upstash.com/docs/redis/howto/connectwithupstashredis",
    },
    {
      label: "GitHub App",
      ready: Boolean(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY),
      envVars: ["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY", "GITHUB_APP_SLUG"],
      help: "Lets users connect repositories during onboarding.",
      href: "https://docs.github.com/en/apps/creating-github-apps",
    },
  ];

  const readyCount = checks.filter((item) => item.ready).length;
  const productionReady = readyCount === checks.length;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Workspace settings</h1>
        <p className="mt-2 text-muted-foreground">
          Configure integrations and environment variables for production.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Infrastructure checklist</CardTitle>
          <CardDescription>
            {readyCount} of {checks.length} ready
            {!productionReady ? " — add missing env vars in your hosting provider, then redeploy." : "."}
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {checks.map((item) => (
            <div key={item.label} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  {item.ready ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  ) : (
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.help}</p>
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                      {item.envVars.join(" · ")}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-primary hover:underline"
                      >
                        Setup guide
                      </a>
                    ) : null}
                  </div>
                </div>
                <span className={item.ready ? "text-xs text-emerald-400" : "text-xs text-amber-400"}>
                  {item.ready ? "Connected" : "Needs configuration"}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What to do next</CardTitle>
          <CardDescription>Get up and running in production.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Configure the integrations above in Vercel or your deployment environment.</p>
          <p>2. Sign in and connect GitHub from onboarding.</p>
          <p>3. Create a repository project and install the browser SDK or connect GA4, PostHog, or Vercel Analytics.</p>
          <p>4. Open the repository overview and confirm events appear within a few minutes.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/docs">Read the docs</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/onboarding">
                Add repository
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
