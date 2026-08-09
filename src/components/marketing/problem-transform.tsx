"use client";

import { useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { looseEnds } from "@/components/marketing/demo-data";
import { useRevealHidden } from "@/components/marketing/reveal";
import { easing, stagger } from "@/lib/motion";

/**
 * The transformation, shown rather than described: unsorted fragments on the
 * left, the four things Sonae sorts them into on the right.
 */
const buckets = [
  { label: "Events", detail: "Move to New House · Aug 9 – Sep 1" },
  { label: "Tasks", detail: "Update banking address · Aug 25" },
  { label: "Reminders", detail: "Return window closes in 5 days" },
  { label: "Waiting items", detail: "Lease addendum · Landlord · 2 days" },
];

export function ProblemTransform() {
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useRevealHidden(ref);

  /** Both columns animate off one measurement, so the halves stay in step. */
  const enter = (index: number, axis: "x" | "y", offset: number, base = 0) => ({
    initial: false as const,
    animate: { opacity: hidden ? 0 : 1, [axis]: hidden ? offset : 0 },
    transition: hidden
      ? { duration: 0 }
      : { duration: 0.25, ease: easing.out, delay: base + index * stagger.list },
  });

  return (
    <div ref={ref} className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
      <div>
        <p className="type-label">What arrives</p>
        <ul className="mt-3 space-y-2">
          {looseEnds.map((item, index) => (
            <motion.li
              key={item}
              {...enter(index, "x", -6)}
              // Deliberately ragged — this is the mess, before anything sorts it.
              style={{ marginLeft: `${(index % 3) * 12}px` }}
              className="w-fit rounded-[var(--radius-control)] border border-dashed border-hairline-strong bg-canvas-soft px-3 py-2 text-[0.9375rem] text-body"
            >
              {item}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center text-muted-soft" aria-hidden>
        <ArrowDown className="size-5 lg:hidden" />
        <ArrowRight className="hidden size-5 lg:block" />
      </div>

      <div>
        <p className="type-label">What Sonae keeps</p>
        <ul className="surface-card mt-3 divide-y divide-hairline-soft">
          {buckets.map((bucket, index) => (
            <motion.li
              key={bucket.label}
              {...enter(index, "y", 6, 0.15)}
              className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
            >
              <span className="type-card-title shrink-0 sm:w-32">{bucket.label}</span>
              <span className="type-mono min-w-0 text-muted">{bucket.detail}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
