import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DashboardSidebarMobileTrigger,
  DashboardSidebarProvider,
} from "@/components/dashboard-sidebar";
import { clerkConfigured } from "@/lib/auth";

export function AppShell({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: { isDemo: boolean };
}) {
  const demoMode = viewer.isDemo;

  return (
    <DashboardSidebarProvider>
      <div className="min-h-screen lg:pl-60">
        <div className="flex min-h-screen flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <DashboardSidebarMobileTrigger />
              {demoMode ? (
                <Badge variant="outline" className="text-xs">
                  Demo workspace
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {demoMode ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={clerkConfigured ? "/sign-up" : "/dashboard/settings"}>
                    {clerkConfigured ? "Create account" : "Production setup"}
                  </Link>
                </Button>
              ) : null}
              {clerkConfigured ? (
                <UserButton />
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </DashboardSidebarProvider>
  );
}
