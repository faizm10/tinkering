import Link from "next/link";
import { ClipboardCheck, Clock, History, Home, Inbox, ListTodo, Settings, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/events", label: "Events", icon: ClipboardCheck },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/waiting", label: "Waiting", icon: Clock },
  { href: "/approvals", label: "Approvals", icon: Sparkles },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-border bg-card/70 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:space-y-8 lg:px-6 lg:py-7">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-primary text-primary-foreground">
              <Inbox className="h-4 w-4" />
            </span>
            <span className="font-semibold">Life Admin</span>
          </Link>
          <div className="hidden text-sm text-muted-foreground lg:block">{user.email}</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-4">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 px-5 py-6 md:px-8 lg:px-10">{children}</main>
    </div>
  );
}
