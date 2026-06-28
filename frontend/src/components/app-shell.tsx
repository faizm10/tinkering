import { UserButton } from "@clerk/nextjs";
import {
  DashboardSidebarMobileTrigger,
  DashboardSidebarProvider,
  type SidebarProject,
} from "@/components/dashboard-sidebar";

export function AppShell({
  children,
  projects = [],
}: {
  children: React.ReactNode;
  projects?: SidebarProject[];
}) {
  return (
    <DashboardSidebarProvider projects={projects}>
      <div className="min-h-screen lg:pl-60">
        <div className="flex min-h-screen flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <DashboardSidebarMobileTrigger />
            </div>
            <div className="flex items-center gap-3">
              <UserButton />
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </DashboardSidebarProvider>
  );
}
