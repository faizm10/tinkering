import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Empty states are editorial: one calm sentence, at most one next action.
 * No illustrations, no dashed placeholder boxes.
 */
export function EmptyState({
  message,
  hint,
  action,
  className,
}: {
  message: string;
  hint?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("py-6", className)}>
      <p className="type-body text-ink">{message}</p>
      {hint ? <p className="type-meta mt-1 max-w-md">{hint}</p> : null}
      {action ? (
        <Button asChild variant="secondary" size="sm" className="mt-4">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message = "Your data was not changed. Try loading this screen again.",
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("surface-card max-w-lg p-6", className)}>
      <p className="type-label text-error">Error</p>
      <h2 className="type-section mt-2">{title}</h2>
      <p className="type-body mt-1.5 text-body">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Skeletons are shaped like the thing they replace, so pages do not reflow
 * when data arrives. Each screen composes its own out of these two atoms.
 */
export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-3 animate-pulse rounded-[3px] bg-hairline motion-reduce:animate-none", className)}
      aria-hidden
    />
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-card)] bg-hairline-soft motion-reduce:animate-none", className)}
      aria-hidden
    />
  );
}

/** Wraps a skeleton so screen readers hear one status instead of nothing. */
export function LoadingState({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
