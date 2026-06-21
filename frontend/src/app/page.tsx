import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  Github,
  Layers3,
  LineChart,
  MousePointerClick,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const repositories = [
  { name: "acme/web-app", users: "12.4k", sessions: "18.9k", change: "+18%" },
  { name: "acme/developer-docs", users: "4.8k", sessions: "7.2k", change: "+9%" },
  { name: "acme/customer-portal", users: "2.1k", sessions: "3.7k", change: "+14%" },
];

const features = [
  {
    icon: Layers3,
    title: "Repository-first reporting",
    description:
      "Keep every product's metrics attached to the GitHub repository your team already understands.",
  },
  {
    icon: BarChart3,
    title: "Google Analytics, unified",
    description:
      "Connect a GA4 property per repository and compare users, sessions, page views, and events in one view.",
  },
  {
    icon: ShieldCheck,
    title: "Built for private products",
    description:
      "Read-only integrations, encrypted credentials, and isolated data for every connected repository.",
  },
];

const bars = [42, 48, 44, 59, 55, 68, 63, 76, 71, 82, 78, 92];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8">
          <Logo />
          <nav className="ml-10 hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#product">
              Product
            </a>
            <a className="transition-colors hover:text-foreground" href="#workflow">
              How it works
            </a>
            <Link className="transition-colors hover:text-foreground" href="/docs">
              Documentation
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/onboarding">
                Start connecting
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="landing-grid absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-6 gap-2 bg-background/70 px-3 py-1">
              <span className="size-1.5 rounded-full bg-primary" />
              Analytics for teams shipping across repositories
            </Badge>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              One view of every product your team ships.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              RepoPulse brings product analytics into a GitHub-centered workspace, so teams can
              understand adoption and growth without jumping between properties and dashboards.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-6">
                <Link href="/dashboard/onboarding">
                  Connect your first repository
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-6">
                <Link href="/dashboard">View product demo</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {["Read-only GitHub access", "GA4 imports", "No credit card"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-8 sm:px-8 md:flex-row">
          <p className="text-sm text-muted-foreground">Built around the tools your team already uses</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-muted-foreground sm:gap-12">
            <span className="flex items-center gap-2">
              <Github className="size-4" />
              GitHub
            </span>
            <span className="flex items-center gap-2">
              <BarChart3 className="size-4" />
              Google Analytics
            </span>
            <span className="flex items-center gap-2">
              <Activity className="size-4" />
              RepoPulse SDK
            </span>
          </div>
        </div>
      </section>

      <section id="product" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">A clearer operating view</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Analytics organized the way engineering teams work.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Move from disconnected properties to one consistent portfolio of repositories,
            products, and engagement signals.
          </p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="bg-card p-7 sm:p-8">
              <span className="flex size-9 items-center justify-center rounded-md border border-border bg-secondary">
                <feature.icon className="size-4 text-primary" />
              </span>
              <h3 className="mt-6 font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="border-y border-border bg-card/35">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="max-w-md">
              <p className="text-sm font-medium text-primary">Simple by design</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                From repository to insight in minutes.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Keep setup lightweight and give the whole team a shared source of truth.
              </p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {[
                ["01", "Connect GitHub", "Install the read-only GitHub App on selected repositories."],
                ["02", "Link analytics", "Attach the matching GA4 property or use the RepoPulse SDK."],
                ["03", "Review the portfolio", "Compare adoption, engagement, and growth from one dashboard."],
              ].map(([number, title, description]) => (
                <div key={number} className="grid gap-3 py-6 sm:grid-cols-[72px_180px_1fr] sm:items-center">
                  <span className="font-mono text-xs text-muted-foreground">{number}</span>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-start justify-between gap-8 p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Your products, one workspace</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
                Stop rebuilding the same analytics view for every repository.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Connect your portfolio and give product and engineering one place to understand what
                customers actually use.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/dashboard/onboarding">
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <Logo />
          <p className="sm:ml-4">GitHub-centered product analytics.</p>
          <div className="flex gap-6 sm:ml-auto">
            <Link className="hover:text-foreground" href="/docs">
              Docs
            </Link>
            <Link className="hover:text-foreground" href="/sign-in">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-6xl sm:mt-20">
      <div className="absolute -inset-8 -z-10 bg-primary/[0.035] blur-3xl" />
      <Card className="overflow-hidden bg-card shadow-2xl shadow-black/30">
        <div className="flex h-12 items-center border-b border-border px-4">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </div>
          <p className="mx-auto pr-12 font-mono text-[11px] text-muted-foreground">
            app.repopulse.dev/portfolio
          </p>
        </div>
        <div className="grid min-h-[470px] md:grid-cols-[190px_1fr]">
          <aside className="hidden border-r border-border p-4 md:block">
            <Logo />
            <div className="mt-8 space-y-1">
              <div className="rounded-md bg-secondary px-3 py-2 text-xs font-medium">Portfolio</div>
              {["Repositories", "Users", "Integrations"].map((item) => (
                <div key={item} className="px-3 py-2 text-xs text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div className="min-w-0 p-5 sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Portfolio overview</p>
                <p className="mt-1 text-lg font-semibold">Product engagement</p>
              </div>
              <Badge variant="outline">Last 30 days</Badge>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["Active users", "19.3k", Users],
                ["Sessions", "29.8k", MousePointerClick],
                ["Events", "142k", Activity],
              ].map(([label, value, Icon]) => (
                <div key={String(label)} className="rounded-lg border border-border bg-background/50 p-4">
                  <Icon className="size-3.5 text-muted-foreground" />
                  <p className="mt-5 font-mono text-lg font-semibold sm:text-xl">{String(value)}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">
                    {String(label)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Active users</p>
                  <LineChart className="size-3.5 text-muted-foreground" />
                </div>
                <div className="mt-5 flex h-28 items-end gap-1.5">
                  {bars.map((height, index) => (
                    <div
                      key={height + index}
                      className="flex-1 rounded-sm bg-primary/70"
                      style={{ height: `${height}%`, opacity: 0.35 + index * 0.045 }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <p className="text-xs font-medium">Connected sources</p>
                <div className="mt-5 space-y-4">
                  {[
                    ["GitHub", "3 repositories", Github],
                    ["Google Analytics", "3 properties", BarChart3],
                    ["RepoPulse", "Live", Activity],
                  ].map(([name, value, Icon]) => (
                    <div key={String(name)} className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-md bg-secondary">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs">{String(name)}</p>
                        <p className="text-[10px] text-muted-foreground">{String(value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              {repositories.map((repository, index) => (
                <div
                  key={repository.name}
                  className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-xs ${
                    index < repositories.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="truncate font-medium">{repository.name}</span>
                  <span className="hidden font-mono text-muted-foreground sm:inline">
                    {repository.users} users
                  </span>
                  <span className="font-mono text-primary">{repository.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
