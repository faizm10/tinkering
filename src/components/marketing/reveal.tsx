"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";

import { easing } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Scroll reveals that can never hide content by accident.
 *
 * The default state is *visible*, including in the server-rendered HTML. Only
 * once the effect has run — meaning JS is live and motion is wanted — does an
 * off-screen element get hidden, and that hide is instant so there is no
 * flash. If hydration never happens, if the observer never fires, or if the
 * reader prefers reduced motion, the page simply reads as static.
 *
 * Position is measured with `getBoundingClientRect` on scroll rather than via
 * IntersectionObserver, so it also behaves in webviews where IO is throttled.
 */
export function useRevealHidden(ref: RefObject<HTMLElement | null>) {
  const reduceMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    const element = ref.current;
    if (!element) return;

    let frame = 0;
    let settled = false;

    const onScreen = () => {
      const rect = element.getBoundingClientRect();
      // Counts as on screen once the top edge is 60px inside the viewport.
      return rect.top < window.innerHeight - 60 && rect.bottom > 0;
    };

    const check = () => {
      frame = 0;
      if (settled) return;
      if (onScreen()) {
        settled = true;
        setHidden(false);
      }
    };

    const schedule = () => {
      if (settled || frame) return;
      frame = requestAnimationFrame(check);
    };

    // Arm synchronously-ish: anything already on screen is left alone, anything
    // below the fold is hidden so it has something to animate from.
    queueMicrotask(() => {
      if (onScreen()) {
        settled = true;
        return;
      }
      setHidden(true);
    });

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", check);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", check);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, reduceMotion]);

  return hidden;
}

/** Section entrance: one fade and a short rise, played once. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useRevealHidden(ref);

  const Component = as === "li" ? motion.li : as === "section" ? motion.section : motion.div;

  return (
    <Component
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- one ref type across three tags
      ref={ref as any}
      initial={false}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? 10 : 0 }}
      // Hiding is instant so arming the reveal is never visible; showing animates.
      transition={hidden ? { duration: 0 } : { duration: 0.3, ease: easing.out, delay }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
