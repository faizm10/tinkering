import type { Transition, Variants } from "motion/react";

/**
 * Motion tokens for Life Admin.
 *
 * The system is deliberately quiet: transform and opacity only, short
 * durations, no bounce. Anything longer than ~300ms reads as sluggish in a
 * planner people open twenty times a day.
 */
export const duration = {
  hover: 0.12,
  press: 0.1,
  control: 0.16,
  panel: 0.2,
  page: 0.24,
} as const;

export const easing = {
  /** Decelerating — entrances and most state changes. */
  out: [0.22, 0.61, 0.36, 1],
  /** Symmetric — layout moves and reorders. */
  inOut: [0.4, 0, 0.2, 1],
} as const;

export const stagger = {
  list: 0.028,
  tight: 0.02,
} as const;

export const transition = {
  control: { duration: duration.control, ease: easing.out },
  panel: { duration: duration.panel, ease: easing.out },
  page: { duration: duration.page, ease: easing.out },
  /** Used with `layout` so reordered rows slide rather than jump. */
  layout: { duration: duration.panel, ease: easing.inOut },
} as const satisfies Record<string, Transition>;

/** Page and section entrance: fade plus a 6–8px rise. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...transition.page, staggerChildren: stagger.list },
  },
};

export const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: stagger.list } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: transition.panel },
};

/** Panels that expand in place (proposal sections, inline editors). */
export const collapseVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: transition.panel },
  exit: { opacity: 0, height: 0, transition: { duration: duration.control, ease: easing.out } },
};

/** Mobile sheets slide from the bottom edge. */
export const sheetVariants: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: transition.panel },
  exit: { y: "100%", transition: { duration: duration.control, ease: easing.out } },
};
