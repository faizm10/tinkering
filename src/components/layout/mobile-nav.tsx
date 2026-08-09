"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { AgentComposer } from "@/components/agent/agent-composer";
import { isActive, mobileNav } from "@/components/layout/nav-items";
import { duration, easing, sheetVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Mobile navigation: four destinations either side of a central Add action
 * that opens the composer in a sheet. Every target clears 44px and the bar
 * pads itself out of the home-indicator area.
 */
export function MobileNavigation() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-lg items-stretch">
          {mobileNav.slice(0, 2).map((item) => (
            <MobileNavLink key={item.href} item={item} pathname={pathname} />
          ))}

          <li className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-expanded={sheetOpen}
              className="my-1.5 grid size-11 place-items-center rounded-[var(--radius-control)] bg-primary text-on-primary transition-colors duration-[var(--dur-hover)] active:bg-primary-active"
            >
              <Plus className="size-5" />
              <span className="sr-only">Tell Life Admin what’s happening</span>
            </button>
          </li>

          {mobileNav.slice(2).map((item) => (
            <MobileNavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>

      <ComposerSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

function MobileNavLink({
  item,
  pathname,
}: {
  item: (typeof mobileNav)[number];
  pathname: string;
}) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);

  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-14 flex-col items-center justify-center gap-1 text-[0.6875rem]",
          active ? "text-ink" : "text-muted",
        )}
      >
        <Icon className="size-5" />
        {item.shortLabel ?? item.label}
      </Link>
    </li>
  );
}

function ComposerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement as HTMLElement | null;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Keep Tab inside the sheet while it is modal.
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      // Send focus back where it came from, not to the top of the page.
      opener?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.control, ease: easing.out }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/25"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Tell Life Admin what’s happening"
            tabIndex={-1}
            variants={reduceMotion ? undefined : sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[var(--radius-card)] border-t border-hairline bg-canvas outline-none"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            <div className="flex items-center justify-between px-4 pb-1 pt-3">
              <span className="type-label">New situation</span>
              <button
                type="button"
                onClick={onClose}
                className="grid size-11 place-items-center rounded-[var(--radius-control)] text-muted"
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="px-4 pb-4">
              <AgentComposer autoFocus onNavigate={onClose} />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
