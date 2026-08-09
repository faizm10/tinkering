"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Wordmark } from "@/components/layout/wordmark";
import { isActive, primaryNav } from "@/components/layout/nav-items";
import { authClient } from "@/lib/auth/client";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A flat sidebar on the cream canvas: no floating card, no shadow, one
 * hairline against the content column. The active item is marked by a short
 * ink rule that slides between destinations.
 */
export function Sidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <Wordmark className="px-2" />

      <nav aria-label="Primary" className="flex-1">
        <ul className="space-y-0.5">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <li key={item.href} className="relative">
                {active ? (
                  <motion.span
                    layoutId={reduceMotion ? undefined : "sidebar-active"}
                    transition={transition.layout}
                    className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-ink"
                    aria-hidden
                  />
                ) : null}
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[var(--radius-control)] px-3 py-2 text-sm",
                    "transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out)]",
                    active ? "font-medium text-ink" : "text-body hover:bg-hairline-soft hover:text-ink",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active ? "text-ink" : "text-muted")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-hairline px-1 pt-4">
        <p className="truncate text-sm text-ink">{user.name}</p>
        <p className="type-meta truncate">{user.email}</p>
        <button
          type="button"
          onClick={signOut}
          className="mt-2.5 inline-flex items-center gap-1.5 text-[0.8125rem] text-muted transition-colors duration-[var(--dur-hover)] hover:text-ink"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
