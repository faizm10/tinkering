import Link from "next/link";

import { cn } from "@/lib/utils";

export function Wordmark({ href = "/dashboard", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        // Negative margin keeps the 44px tap area from changing the layout.
        "-my-2 inline-flex min-h-11 items-center gap-2.5 rounded-[var(--radius-control)] text-ink",
        className,
      )}
    >
      <span
        className="grid size-7 place-items-center rounded-[6px] bg-ink text-[0.875rem] font-semibold leading-none text-canvas"
        aria-hidden
      >
        S
      </span>
      <span className="text-[0.9375rem] tracking-[0.02em]">Sonae</span>
    </Link>
  );
}
