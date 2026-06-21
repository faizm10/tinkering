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
  Zap,
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

const steps = [
  {
    number: "01",
    title: "Connect GitHub",
    description: "Install the read-only GitHub App on selected repositories.",
    icon: Github,
  },
  {
    number: "02",
    title: "Link analytics",
    description: "Attach the matching GA4 property or use the RepoPulse SDK.",
    icon: BarChart3,
  },
  {
    number: "03",
    title: "Review the portfolio",
    description: "Compare adoption, engagement, and growth from one dashboard.",
    icon: Zap,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
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
            <Button asChild variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="gap-1.5 shadow-lg shadow-primary/20">
              <Link href="/dashboard/onboarding">
                Get started
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="landing-grid absolute inset-0 opacity-50" />
        <div className="hero-glow absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-8 sm:pb-32 sm:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              variant="outline"
              className="mb-8 gap-2 border-primary/20 bg-primary/5 px-3.5 py-1.5 text-primary/80 shadow-sm"
            >
              <span className="hero-dot size-1.5 rounded-full bg-primary" />
              Analytics for teams shipping across repositories
            </Badge>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              One view of every product{" "}
              <span className="gradient-text">your team ships.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              RepoPulse brings product analytics into a GitHub-centered workspace, so teams can
              understand adoption and growth without jumping between properties and dashboards.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7 shadow-xl shadow-primary/25 text-base">
                <Link href="/dashboard/onboarding">
                  Connect your first repository
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-7 border-border/60 bg-card/50 text-base hover:bg-card hover:border-border"
              >
                <Link href="/dashboard">View product demo</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2 text-xs text-muted-foreground">
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

      {/* Integration bar */}
      <section className="border-b border-border/50 bg-card/20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-7 sm:px-8 md:flex-row">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
            Built around the tools your team already uses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-2 transition-colors hover:text-foreground">
              <Github className="size-4" />
              GitHub
            </span>
            <span className="flex items-center gap-2 transition-colors hover:text-foreground">
              <BarChart3 className="size-4" />
              Google Analytics
            </span>
            <span className="flex items-center gap-2 transition-colors hover:text-foreground">
              <Activity className="size-4" />
              RepoPulse SDK
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="product" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">A clearer operating view</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Analytics organized the way engineering teams work.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Move from disconnected properties to one consistent portfolio of repositories,
            products, and engagement signals.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="feature-card group relative rounded-2xl border border-border/60 bg-card/60 p-8 transition-all duration-300 hover:border-primary/20 hover:bg-card hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="feature-card-glow absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <feature.icon className="size-5 text-primary" />
              </span>
              <h3 className="relative mt-6 font-semibold">{feature.title}</h3>
              <p className="relative mt-3 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="workflow" className="border-y border-border/50">
        <div className="workflow-bg absolute left-0 right-0 h-full" />
        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="mb-14 max-w-2xl">
            <p className="text-sm font-medium text-primary">Simple by design</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              From repository to insight in minutes.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Keep setup lightweight and give the whole team a shared source of truth.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <div
                key={number}
                className="relative rounded-2xl border border-border/60 bg-card/40 p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-4xl font-bold text-border">{number}</span>
                  <span className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-secondary/50">
                    <Icon className="size-4 text-muted-foreground" />
                  </span>
                </div>
                <h3 className="mt-8 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="cta-card relative overflow-hidden rounded-3xl border border-primary/15 bg-card/80 p-10 sm:p-14">
          <div className="cta-glow absolute inset-0" />
          <div className="relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Your products, one workspace</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                Stop rebuilding the same analytics view for every repository.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                Connect your portfolio and give product and engineering one place to understand what
                customers actually use.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button asChild size="lg" className="h-12 px-7 shadow-xl shadow-primary/30">
                <Link href="/dashboard/onboarding">
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-7 border-border/50 bg-background/50 hover:bg-background"
              >
                <Link href="/docs">Read the docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <Logo />
          <p className="sm:ml-4 text-muted-foreground/60">GitHub-centered product analytics.</p>
          <div className="flex gap-6 sm:ml-auto">
            <Link className="transition-colors hover:text-foreground" href="/docs">
              Docs
            </Link>
            <Link className="transition-colors hover:text-foreground" href="/sign-in">
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
    <div className="relative mx-auto mt-20 max-w-6xl">
      <div className="absolute -inset-12 -z-10 rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent blur-xl" />
      <Card className="overflow-hidden border-border/50 bg-card shadow-2xl shadow-black/50 ring-1 ring-border/30">
        <div className="flex h-12 items-center justify-between border-b border-border/50 bg-background/30 px-4">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-border/60" />
            <span className="size-3 rounded-full bg-border/60" />
            <span className="size-3 rounded-full bg-border/60" />
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-border/40 bg-background/50 px-3 py-1">
            <span className="size-1.5 rounded-full bg-primary/70" />
            <p className="font-mono text-[10px] text-muted-foreground">
              app.repopulse.dev/portfolio
            </p>
          </div>
          <div className="w-16" />
        </div>
        <div className="grid min-h-[480px] md:grid-cols-[190px_1fr]">
          <aside className="hidden border-r border-border/50 bg-background/20 p-4 md:block">
            <Logo />
            <div className="mt-8 space-y-0.5">
              <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                Portfolio
              </div>
              {["Repositories", "Users", "Integrations"].map((item) => (
                <div key={item} className="px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div className="min-w-0 bg-background/10 p-5 sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Portfolio overview</p>
                <p className="mt-1 text-lg font-semibold">Product engagement</p>
              </div>
              <Badge variant="outline" className="border-border/50 bg-card/50">Last 30 days</Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["Active users", "19.3k", Users],
                ["Sessions", "29.8k", MousePointerClick],
                ["Events", "142k", Activity],
              ].map(([label, value, Icon]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-border/40 bg-background/50 p-4 transition-colors hover:border-primary/20"
                >
                  <Icon className="size-3.5 text-primary/60" />
                  <p className="mt-4 font-mono text-xl font-semibold sm:text-2xl">{String(value)}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">
                    {String(label)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-xl border border-border/40 bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Active users</p>
                  <LineChart className="size-3.5 text-muted-foreground" />
                </div>
                <div className="mt-5 flex h-28 items-end gap-1">
                  {bars.map((height, index) => (
                    <div
                      key={height + index}
                      className="flex-1 rounded-t-sm bg-primary"
                      style={{ height: `${height}%`, opacity: 0.2 + index * 0.065 }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/40 bg-background/50 p-4">
                <p className="text-xs font-medium">Connected sources</p>
                <div className="mt-5 space-y-3.5">
                  {[
                    ["GitHub", "3 repositories", Github],
                    ["Google Analytics", "3 properties", BarChart3],
                    ["RepoPulse", "Live", Activity],
                  ].map(([name, value, Icon]) => (
                    <div key={String(name)} className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-lg border border-border/40 bg-secondary/60">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{String(name)}</p>
                        <p className="text-[10px] text-muted-foreground">{String(value)}</p>
                      </div>
                      <span className="ml-auto text-[10px] text-primary/80">●</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-border/40">
              {repositories.map((repository, index) => (
                <div
                  key={repository.name}
                  className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-xs transition-colors hover:bg-primary/5 ${
                    index < repositories.length - 1 ? "border-b border-border/40" : ""
                  }`}
                >
                  <span className="truncate font-medium">{repository.name}</span>
                  <span className="hidden font-mono text-muted-foreground sm:inline">
                    {repository.users} users
                  </span>
                  <span className="font-mono font-medium text-primary">{repository.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
