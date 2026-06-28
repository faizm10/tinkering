"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, use, useState } from "react";
import { BookOpen, FolderGit2, Github, LayoutDashboard, Menu, Plus, Settings, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type SidebarProject = {
  slug: string;
  fullName: string;
};

const primaryLinks = [
  { href: "/dashboard", label: "Portfolio", icon: LayoutDashboard },
  { href: "/dashboard/onboarding", label: "Add repository", icon: Plus },
] as const;

const footerLinks = [
  { href: "/docs", label: "SDK docs", icon: BookOpen, external: false },
  { href: "/dashboard/settings", label: "Workspace settings", icon: Settings, external: false },
  {
    href: "https://github.com/settings/installations",
    label: "GitHub App",
    icon: Github,
    external: true,
  },
] as const;

type NavContextValue = {
  openMobile: () => void;
};

const NavContext = createContext<NavContextValue | null>(null);

function SidebarNav({
  projects = [],
  onNavigate,
}: {
  projects?: SidebarProject[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <nav className="space-y-1 p-3">
        {primaryLinks.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && (pathname?.startsWith(href) ?? false));
          return (
            <Button
              key={href}
              asChild
              variant={active ? "secondary" : "ghost"}
              className={cn("w-full justify-start", !active && "text-muted-foreground")}
            >
              <Link href={href} onClick={onNavigate}>
                <Icon className="size-4" />
                {label}
              </Link>
            </Button>
          );
        })}
      </nav>

      {projects.length > 0 ? (
        <div className="px-3 pb-2">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            Projects
          </p>
          <div className="max-h-[calc(100vh-22rem)] space-y-0.5 overflow-y-auto">
            {projects.map((project) => {
              const href = `/dashboard/${project.slug}/overview`;
              const active = pathname?.startsWith(`/dashboard/${project.slug}`) ?? false;
              return (
                <Button
                  key={project.slug}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start font-normal",
                    !active && "text-muted-foreground",
                  )}
                >
                  <Link href={href} onClick={onNavigate} title={project.fullName}>
                    <FolderGit2 className="size-4 shrink-0" />
                    <span className="truncate">{project.slug}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="absolute inset-x-3 bottom-4 space-y-1">
        {footerLinks.map(({ href, label, icon: Icon, external }) => (
          <Button
            key={href}
            asChild
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
          >
            {external ? (
              <a href={href} target="_blank" rel="noreferrer" onClick={onNavigate}>
                <Icon className="size-4" />
                {label}
              </a>
            ) : (
              <Link href={href} onClick={onNavigate}>
                <Icon className="size-4" />
                {label}
              </Link>
            )}
          </Button>
        ))}
      </div>
    </>
  );
}

export function DashboardSidebarProvider({
  children,
  projects = [],
}: {
  children: React.ReactNode;
  projects?: SidebarProject[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <NavContext value={{ openMobile: () => setMobileOpen(true) }}>
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card/45 lg:block">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <Separator />
        <SidebarNav projects={projects} />
      </aside>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 border-r border-border bg-card lg:hidden">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <Separator />
            <SidebarNav projects={projects} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      ) : null}

      {children}
    </NavContext>
  );
}

export function DashboardSidebarMobileTrigger() {
  const context = use(NavContext);
  if (!context) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="lg:hidden"
      aria-label="Open navigation"
      onClick={context.openMobile}
    >
      <Menu className="size-5" />
    </Button>
  );
}
