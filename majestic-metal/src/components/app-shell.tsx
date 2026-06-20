import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen, Github, LayoutDashboard, Plus, Settings } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { clerkConfigured } from "@/lib/auth";

export function AppShell({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: { name: string; isDemo: boolean };
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card/45 lg:block">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <Separator />
        <nav className="space-y-1 p-3">
          <Button asChild variant="secondary" className="w-full justify-start">
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" />
              Portfolio
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
            <Link href="/dashboard/onboarding">
              <Plus className="size-4" />
              Add repository
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
            <a href="https://github.com/settings/installations" target="_blank" rel="noreferrer">
              <Github className="size-4" />
              GitHub App
            </a>
          </Button>
        </nav>
        <div className="absolute inset-x-3 bottom-4 space-y-1">
          <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
            <Link href="/docs">
              <BookOpen className="size-4" />
              SDK docs
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
            <Link href="/dashboard/settings">
              <Settings className="size-4" />
              Workspace settings
            </Link>
          </Button>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <Logo className="lg:hidden" />
          <div className="ml-auto flex items-center gap-3">
            {viewer.isDemo && <Badge variant="outline">Demo data</Badge>}
            <span className="hidden text-sm text-muted-foreground sm:inline">{viewer.name}</span>
            {clerkConfigured ? (
              <UserButton />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                RP
              </span>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
