import { MobileNavigation } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Wordmark } from "@/components/layout/wordmark";
import { PageTransition } from "@/components/layout/page-transition";
import { requireUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/env";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const demoMode = isDemoMode();

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[236px_1fr]">
      {/* Desktop: a flat column on the canvas, separated by one hairline. */}
      <aside className="sticky top-0 hidden h-screen border-r border-hairline lg:block">
        <Sidebar user={user} demoMode={demoMode} />
      </aside>

      {/* Mobile: a compact top bar, with navigation living at the bottom. */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-hairline bg-canvas/95 px-4 backdrop-blur-sm lg:hidden">
        <Wordmark />
        {demoMode ? (
          <span className="type-label ml-auto rounded-[var(--radius-control)] border border-hairline bg-surface px-2 py-1 text-muted">
            Demo mode
          </span>
        ) : null}
      </header>

      <main
        id="main"
        className="min-w-0 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-9"
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      <MobileNavigation />
    </div>
  );
}
