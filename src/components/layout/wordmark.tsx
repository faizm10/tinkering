import Link from "next/link";

import { brandIcon as BrandIcon } from "@/components/layout/nav-items";
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
        className="grid size-7 place-items-center rounded-[6px] bg-ink text-canvas"
        aria-hidden
      >
        <BrandIcon className="size-3.5" />
      </span>
      <span className="text-[0.9375rem] tracking-[-0.01em]">Life Admin</span>
    </Link>
  );
}
