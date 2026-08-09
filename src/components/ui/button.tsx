import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Buttons follow design.md: compact 8px radius, 14px/500 label, hairline
 * borders instead of shadows. Orange is the only brand voltage and belongs to
 * `primary` alone — everything else is ink, white-on-hairline, or plain text.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[var(--radius-control)] border border-transparent",
    "text-sm font-medium leading-none",
    "transition-[background-color,border-color,color,opacity,transform] duration-[var(--dur-hover)] ease-[var(--ease-out)]",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    "active:scale-[0.985] motion-reduce:active:scale-100",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-active active:bg-primary-active",
        secondary:
          "border-hairline-strong bg-surface text-ink hover:border-ink/25 hover:bg-canvas-soft",
        ink: "bg-ink text-canvas hover:bg-ink/90",
        ghost: "text-body hover:bg-hairline-soft hover:text-ink",
        subtle: "bg-hairline-soft text-ink hover:bg-surface-strong",
        danger: "text-error hover:bg-error/10",
        link: "text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink",
      },
      size: {
        sm: "h-8 px-3 text-[0.8125rem]",
        md: "h-10 px-[18px]",
        lg: "h-11 px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        /** Mobile-only targets that must clear 44px. */
        touch: "h-11 min-w-11 px-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
