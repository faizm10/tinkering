"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Github,
  Lock,
  RefreshCw,
  Triangle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Repo = {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  archived: boolean;
  selected: boolean;
};

type CreatedProject = {
  repository: string;
  publicKey: string;
  secretKey: string;
};

type AnalyticsSource = "sdk" | "google-analytics" | "posthog" | "vercel";

type Step = 1 | 2 | 3;

type WorkspaceMode = "live" | "demo" | "needs-db";

function OnboardingBlockedState({ mode }: { mode: Exclude<WorkspaceMode, "live"> }) {
  if (mode === "demo") {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <Github className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Sign in to connect GitHub</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You are browsing the demo workspace with sample data. To install the GitHub App and
                track a real repository, create an account and connect GitHub.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/sign-up">Create account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Explore demo dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Database required</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              RepoPulse needs a Postgres connection before it can store projects, API keys, and
              ingested events. Add your database URL in settings, then return here to connect a
              repository.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard/settings">Open settings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to portfolio</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SOURCES: { id: AnalyticsSource; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: "sdk",
    label: "RepoPulse SDK",
    description: "Drop in a JS snippet to track custom events from your app.",
    icon: Activity,
  },
  {
    id: "google-analytics",
    label: "Google Analytics",
    description: "Import GA4 users, sessions, and events via a service account.",
    icon: BarChart3,
  },
  {
    id: "posthog",
    label: "PostHog",
    description: "Pull events and trends from a PostHog project via API.",
    icon: Zap,
  },
  {
    id: "vercel",
    label: "Vercel Analytics",
    description: "Import web analytics data from a Vercel-deployed project.",
    icon: Triangle,
  },
];

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1 as Step, label: "Connect GitHub" },
    { n: 2 as Step, label: "Select repository" },
    { n: 3 as Step, label: "Configure analytics" },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => (
        <div key={step.n} className="flex items-center">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                current > step.n
                  ? "bg-primary text-primary-foreground"
                  : current === step.n
                    ? "border-2 border-primary text-primary"
                    : "border border-border text-muted-foreground"
              }`}
            >
              {current > step.n ? <Check className="size-3" /> : step.n}
            </span>
            <span
              className={`text-sm font-medium transition-colors ${
                current === step.n ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`mx-4 h-px w-12 sm:w-20 ${current > step.n + 1 || (current > step.n) ? "bg-primary/40" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: GitHub ────────────────────────────────────────────────────────────

function GitHubStep({
  repos,
  installUrl,
  error,
  onContinue,
}: {
  repos: Repo[];
  installUrl: string;
  error?: string | null;
  onContinue: () => void;
}) {
  const hasRepos = repos.length > 0;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Connect GitHub</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          RepoPulse needs read-only access to list your repositories and read their metadata.
          No code is ever read or stored.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage(error)}
        </div>
      )}

      {hasRepos ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Check className="size-4 text-primary" />
            </span>
            <div>
              <p className="font-medium text-primary">GitHub connected</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {repos.length} {repos.length === 1 ? "repository" : "repositories"} accessible
              </p>
            </div>
          </div>
          <div className="mt-4 max-h-36 overflow-y-auto space-y-1 rounded-lg border border-border/50 bg-background/50 p-2">
            {repos.slice(0, 8).map((repo) => (
              <div key={repo.id} className="flex items-center gap-2 px-2 py-1.5 text-xs">
                <Github className="size-3 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono">{repo.fullName}</span>
                {repo.private && <Lock className="size-3 shrink-0 text-muted-foreground/60" />}
              </div>
            ))}
            {repos.length > 8 && (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                +{repos.length - 8} more
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <div className="flex items-start gap-3">
              <Github className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Install the GitHub App</p>
                <p className="text-sm text-muted-foreground">
                  You control which repositories are accessible. You can change this at any time
                  from your GitHub settings.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {[
              ["Read-only access", "We only need metadata and basic repo info — never your code."],
              ["You stay in control", "Add or remove repositories directly from GitHub."],
              ["Isolated per repo", "Each repository has its own analytics project and keys."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-border/50 p-3">
                <p className="mb-1 font-medium text-foreground">{title}</p>
                <p className="leading-5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {hasRepos ? (
          <>
            <Button variant="outline" size="sm" asChild>
              <a href={installUrl}>
                <Github className="size-3.5" />
                Add more repositories
              </a>
            </Button>
            <Button onClick={onContinue}>
              Select repository
              <ArrowRight className="size-4" />
            </Button>
          </>
        ) : (
          <Button asChild>
            <a href={installUrl}>
              <Github className="size-4" />
              Install on GitHub
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Repository picker ─────────────────────────────────────────────────

function RepoStep({
  repos,
  onBack,
  onCreated,
}: {
  repos: Repo[];
  onBack: () => void;
  onCreated: (project: CreatedProject) => void;
}) {
  const [selected, setSelected] = useState(repos[0]?.fullName ?? "");
  const [origin, setOrigin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ repositoryFullName: selected, allowedOrigins: [origin] }),
      });
      const body = (await response.json()) as CreatedProject & { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not create project");
        return;
      }
      onCreated(body);
    } finally {
      setPending(false);
    }
  }

  const selectedRepo = repos.find((r) => r.fullName === selected);

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-xl font-semibold">Select repository</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the repository you want to track. Each repository gets its own isolated analytics project.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repo-select">Repository</Label>
          {repos.length > 0 ? (
            <div className="space-y-2">
              <select
                id="repo-select"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.fullName}>
                    {repo.fullName}{repo.private ? " 🔒" : ""}
                  </option>
                ))}
              </select>
              {selectedRepo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Github className="size-3" />
                  <span>{selectedRepo.private ? "Private" : "Public"} repository</span>
                  {selectedRepo.archived && (
                    <Badge variant="outline" className="text-[10px]">Archived</Badge>
                  )}
                  {selectedRepo.selected && (
                    <Badge variant="outline" className="border-primary/30 text-[10px] text-primary">
                      Already connected
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Input
              id="repo-select"
              placeholder="owner/repository-name"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="origin">Allowed origin</Label>
          <Input
            id="origin"
            type="url"
            placeholder="https://your-app.com"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Browser events are accepted only from this origin. You can add more in settings.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={pending || !selected}>
          {pending ? "Creating project…" : "Create project"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}

// ── Step 3: Analytics source ──────────────────────────────────────────────────

function AnalyticsStep({
  project,
  onBack,
}: {
  project: CreatedProject;
  onBack: () => void;
}) {
  const [source, setSource] = useState<AnalyticsSource | null>(null);
  const [sourceConnected, setSourceConnected] = useState(false);
  const repoSlug = project.repository.split("/").at(-1) ?? project.repository;
  const analyticsReady = source === "sdk" || sourceConnected;

  function selectSource(next: AnalyticsSource) {
    setSource(next);
    setSourceConnected(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Configure analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how to pull data into{" "}
          <span className="font-medium text-foreground">{project.repository}</span>.
          You can connect multiple sources later from settings.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => selectSource(s.id)}
            className={`rounded-xl border p-4 text-left transition-all ${
              source === s.id
                ? "border-primary/40 bg-primary/8 ring-1 ring-primary/20"
                : "border-border/60 bg-card/40 hover:border-border hover:bg-card/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                  source === s.id
                    ? "border-primary/30 bg-primary/15"
                    : "border-border/50 bg-secondary/40"
                }`}
              >
                <s.icon className={`size-4 ${source === s.id ? "text-primary" : "text-muted-foreground"}`} />
              </span>
              <span className="font-medium">{s.label}</span>
              {source === s.id && <Check className="ml-auto size-4 text-primary" />}
            </div>
            <p className="mt-2.5 text-xs leading-5 text-muted-foreground">{s.description}</p>
          </button>
        ))}
      </div>

      {source === "sdk" && <SdkConfig project={project} repoSlug={repoSlug} />}
      {source === "google-analytics" && (
        <GoogleAnalyticsConfig repoSlug={repoSlug} onConnected={() => setSourceConnected(true)} />
      )}
      {source === "posthog" && (
        <PosthogConfig repoSlug={repoSlug} onConnected={() => setSourceConnected(true)} />
      )}
      {source === "vercel" && (
        <VercelConfig repoSlug={repoSlug} onConnected={() => setSourceConnected(true)} />
      )}

      {source && source !== "sdk" && !sourceConnected ? (
        <p className="text-sm text-amber-400/90">
          Connect {SOURCES.find((item) => item.id === source)?.label ?? "your source"} before
          opening the dashboard, or skip and finish setup later in repository settings.
        </p>
      ) : null}

      {!source ? (
        <p className="text-sm text-muted-foreground">
          Pick an analytics source above. The browser SDK is ready immediately; imports need a
          quick connection step first.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/${repoSlug}/overview`}>Skip for now</Link>
          </Button>
          {source && analyticsReady ? (
            <Button asChild>
              <Link href={`/dashboard/${repoSlug}/overview`}>
                Open dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button disabled>Open dashboard</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Source config forms ───────────────────────────────────────────────────────

function SdkConfig({ project, repoSlug }: { project: CreatedProject; repoSlug: string }) {
  const endpoint = typeof window !== "undefined"
    ? `${window.location.origin}/api/ingest`
    : "/api/ingest";

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-5">
      <p className="text-sm font-medium">SDK keys for {project.repository}</p>
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
        <p className="text-sm font-medium text-emerald-400">Project is ready</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Copy both keys now — the server key is never shown again.</p>
      </div>
      {([["Browser key", project.publicKey], ["Server key", project.secretKey]] as const).map(([label, value]) => (
        <div key={label} className="space-y-1.5">
          <Label className="text-xs">{label}</Label>
          <div className="flex gap-2">
            <Input readOnly value={value} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => navigator.clipboard.writeText(value)}
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <div className="rounded-lg border border-border/50 bg-background/40 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Browser snippet</p>
        <pre className="overflow-x-auto text-[11px] leading-5 text-muted-foreground">
{`<script src="${endpoint.replace("/api/ingest", "")}/analytics.js"></script>
<script>
  RepoPulse.init({
    projectKey: "${project.publicKey}",
    endpoint: "${endpoint}"
  })
</script>`}
        </pre>
      </div>
    </div>
  );
}

function GoogleAnalyticsConfig({
  repoSlug,
  onConnected,
}: {
  repoSlug: string;
  onConnected?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch(`/api/projects/${repoSlug}/google-analytics`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          propertyId: form.get("propertyId"),
          propertyName: form.get("propertyName") || undefined,
          serviceAccount: form.get("serviceAccount"),
        }),
      });
      const body = (await response.json()) as { connection?: unknown; error?: string };
      if (!response.ok || !body.connection) {
        setError(body.error ?? "Could not connect Google Analytics");
        return;
      }
      setConnected(true);
      onConnected?.();
    } finally {
      setPending(false);
    }
  }

  if (connected) {
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <Check className="size-4 text-emerald-400" />
          <p className="font-medium text-emerald-400">Google Analytics connected</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">GA4 data will sync in the background.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-5" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-xs leading-5 text-muted-foreground">
        Create a Google Cloud service account, enable the Google Analytics Data API, add its email
        as a Viewer on the GA4 property, then paste the downloaded JSON key below.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ga-property-id" className="text-xs">GA4 property ID</Label>
          <Input id="ga-property-id" name="propertyId" inputMode="numeric" placeholder="123456789" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ga-property-name" className="text-xs">Display name (optional)</Label>
          <Input id="ga-property-name" name="propertyName" placeholder="Production site" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ga-service-account" className="text-xs">Service account JSON</Label>
        <Textarea
          id="ga-service-account"
          name="serviceAccount"
          className="min-h-32 font-mono text-xs"
          placeholder='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
          required
        />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        <BarChart3 className="size-4" />
        {pending ? "Connecting…" : "Connect Google Analytics"}
      </Button>
    </form>
  );
}

function PosthogConfig({
  repoSlug,
  onConnected,
}: {
  repoSlug: string;
  onConnected?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch(`/api/projects/${repoSlug}/posthog`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          host: form.get("host"),
          posthogProjectId: form.get("posthogProjectId"),
          personalApiKey: form.get("personalApiKey"),
        }),
      });
      const body = (await response.json()) as { connection?: unknown; error?: string };
      if (!response.ok || !body.connection) {
        setError(body.error ?? "Could not connect PostHog");
        return;
      }
      setConnected(true);
      onConnected?.();
    } finally {
      setPending(false);
    }
  }

  if (connected) {
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <Check className="size-4 text-emerald-400" />
          <p className="font-medium text-emerald-400">PostHog connected</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Events and trends will sync from your PostHog project.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-5" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-xs leading-5 text-muted-foreground">
        Find your project ID in PostHog under{" "}
        <span className="font-mono">Settings → Project → ID</span>. Create a Personal API key under{" "}
        <span className="font-mono">Settings → Account → Personal API Keys</span> with read access.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="posthog-project-id" className="text-xs">PostHog project ID</Label>
          <Input id="posthog-project-id" name="posthogProjectId" placeholder="12345" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="posthog-host" className="text-xs">Host</Label>
          <select
            id="posthog-host"
            name="host"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="https://us.posthog.com">US Cloud (us.posthog.com)</option>
            <option value="https://eu.posthog.com">EU Cloud (eu.posthog.com)</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="posthog-personal-key" className="text-xs">Personal API key</Label>
        <Input
          id="posthog-personal-key"
          name="personalApiKey"
          type="password"
          placeholder="phx_•••••••••••••••••••••••••••••••••••••••••••••••••••••••"
          required
        />
        <p className="text-xs text-muted-foreground">Stored encrypted, never returned to the browser.</p>
      </div>
      {error && <p className="text-sm text-rose-400">{errorMessage(error)}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        <Zap className="size-4" />
        {pending ? "Connecting…" : "Connect PostHog"}
      </Button>
    </form>
  );
}

function VercelConfig({
  repoSlug,
  onConnected,
}: {
  repoSlug: string;
  onConnected?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch(`/api/projects/${repoSlug}/vercel`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vercelProjectId: form.get("vercelProjectId"),
          vercelTeamId: form.get("vercelTeamId") || undefined,
          token: form.get("token"),
        }),
      });
      const body = (await response.json()) as { connection?: unknown; error?: string };
      if (!response.ok || !body.connection) {
        setError(body.error ?? "Could not connect Vercel Analytics");
        return;
      }
      setConnected(true);
      onConnected?.();
    } finally {
      setPending(false);
    }
  }

  if (connected) {
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <Check className="size-4 text-emerald-400" />
          <p className="font-medium text-emerald-400">Vercel Analytics connected</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Web analytics data will sync from your Vercel project.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-5" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-xs leading-5 text-muted-foreground">
        Find your project ID in the Vercel dashboard under{" "}
        <span className="font-mono">Project → Settings → General</span>. Create an API token under{" "}
        <span className="font-mono">Account → Tokens</span>. Vercel Analytics requires a Pro plan.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="vercel-project-id" className="text-xs">Vercel project ID</Label>
          <Input id="vercel-project-id" name="vercelProjectId" placeholder="prj_••••••••••••••••••••••••" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vercel-team-id" className="text-xs">Team ID (optional)</Label>
          <Input id="vercel-team-id" name="vercelTeamId" placeholder="team_•••••••••••••••••••••" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vercel-token" className="text-xs">API token</Label>
        <Input
          id="vercel-token"
          name="token"
          type="password"
          placeholder="•••••••••••••••••••••••••••••••••••••••••"
          required
        />
        <p className="text-xs text-muted-foreground">Stored encrypted, never returned to the browser.</p>
      </div>
      {error && <p className="text-sm text-rose-400">{errorMessage(error)}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        <Triangle className="size-4" />
        {pending ? "Connecting…" : "Connect Vercel Analytics"}
      </Button>
    </form>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

function errorMessage(code: string) {
  const map: Record<string, string> = {
    clerk_not_configured: "Authentication is not configured.",
    database_not_configured: "Database is not configured.",
    invalid_installation_state: "GitHub installation state was invalid. Please try again.",
    github_sync_failed: "Failed to sync your GitHub repositories. Please try again.",
    github_app_not_configured: "GitHub App is not configured yet.",
    posthog_credentials_invalid: "Could not verify PostHog credentials — check your project ID and API key.",
    vercel_credentials_invalid: "Could not verify Vercel credentials — check your project ID and token.",
  };
  return map[code] ?? `Error: ${code}`;
}

export function OnboardingWizard({
  repos,
  installUrl,
  initialError,
  initiallyConnected,
  workspaceMode = "live",
}: {
  repos: Repo[];
  installUrl: string;
  initialError?: string | null;
  initiallyConnected?: boolean;
  workspaceMode?: WorkspaceMode;
}) {
  if (workspaceMode !== "live") {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Badge variant="outline">Onboarding</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Connect a repository</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up analytics for a GitHub repository in a few steps.
          </p>
        </div>
        <OnboardingBlockedState mode={workspaceMode} />
      </div>
    );
  }

  const hasRepos = repos.length > 0;
  const [step, setStep] = useState<Step>(hasRepos && initiallyConnected ? 2 : 1);
  const [project, setProject] = useState<CreatedProject | null>(null);

  function handleCreated(p: CreatedProject) {
    setProject(p);
    setStep(3);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Badge variant="outline">Onboarding</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Connect a repository</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up analytics for a GitHub repository in a few steps.
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <StepIndicator current={step} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
        {step === 1 && (
          <GitHubStep
            repos={repos}
            installUrl={installUrl}
            error={initialError}
            onContinue={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <RepoStep
            repos={repos}
            onBack={() => setStep(1)}
            onCreated={handleCreated}
          />
        )}
        {step === 3 && project && (
          <AnalyticsStep
            project={project}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
