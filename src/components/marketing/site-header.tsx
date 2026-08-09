"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import { duration, easing } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Section anchors live on the homepage. From a sub-page (About, Privacy…) they
 * need the leading slash, so links are written absolute and work from anywhere.
 */
const sectionLinks = [
  { href: "/#product", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#use-cases", label: "Use cases" },
  { href: "/#security", label: "Security" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Compacts from 64px to 56px on scroll and picks up its hairline — no
          floating pill, no shadow. */}
      <header
        className={cn(
          "sticky top-0 z-40 bg-canvas/90 backdrop-blur-sm",
          "transition-[height,border-color] duration-[var(--dur-control)] ease-[var(--ease-out)]",
          "border-b",
          scrolled ? "h-14 border-hairline" : "h-16 border-transparent",
        )}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-6 px-5 lg:px-8">
          <Wordmark href="/" />

          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {sectionLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium text-body transition-colors duration-[var(--dur-hover)] hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            {/* Full 44px target on touch widths, compact on desktop. */}
            <Button asChild size="sm" className="h-11 px-4 sm:h-8 sm:px-3">
              <Link href="/register">Get started</Link>
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="grid size-11 place-items-center rounded-[var(--radius-control)] text-ink md:hidden"
            >
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
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
      opener?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.control, ease: easing.out }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/25"
          />
          <motion.div
            id="site-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            initial={reduceMotion ? false : { y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: duration.panel, ease: easing.out }}
            className="absolute inset-x-0 top-0 border-b border-hairline bg-canvas outline-none"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex h-16 items-center justify-between px-5">
              <Wordmark href="/" />
              <button
                type="button"
                onClick={onClose}
                className="grid size-11 place-items-center rounded-[var(--radius-control)] text-ink"
              >
                <X className="size-5" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <nav aria-label="Sections" className="px-5 pb-5">
              <ul className="divide-y divide-hairline-soft border-t border-hairline">
                {sectionLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="flex h-12 items-center text-[0.9375rem] text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex h-12 items-center text-[0.9375rem] text-ink"
                  >
                    Sign in
                  </Link>
                </li>
              </ul>
              <Button asChild size="touch" className="mt-4 w-full">
                <Link href="/register" onClick={onClose}>
                  Get started
                </Link>
              </Button>
            </nav>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
