"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

import { pageVariants } from "@/lib/motion";

/**
 * Routes fade up 8px on entry. Keyed by pathname so each navigation replays,
 * and skipped entirely when the user prefers reduced motion — the content is
 * mounted the same either way, so nothing waits on the animation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div key={pathname} variants={pageVariants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}
