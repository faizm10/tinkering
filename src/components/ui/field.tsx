import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Form controls share one look: white surface, 1px hairline, 8px radius.
 * Focus moves the border to ink and draws the orange focus ring — colour is
 * never the only signal, the border weight changes too.
 */
const controlClass = [
  "w-full rounded-[var(--radius-control)] border border-hairline-strong bg-surface",
  "px-3 py-2 text-[0.9375rem] text-ink placeholder:text-muted-soft",
  "transition-[border-color,box-shadow] duration-[var(--dur-control)] ease-[var(--ease-out)]",
  "outline-none focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
  "disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-muted-soft",
  "aria-[invalid=true]:border-error",
].join(" ");

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "resize-none", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(controlClass, "h-10 cursor-pointer pr-8", className)} {...props} />;
}

/** Dates are technical metadata, so their inputs render in mono. */
export function DateInput({ className, ...props }: React.ComponentProps<"input">) {
  return <Input className={cn("type-mono h-10", className)} placeholder="YYYY-MM-DD" {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("block text-[0.8125rem] font-medium text-body", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="type-meta">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[0.8125rem] text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
