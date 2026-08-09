"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { AgentTimeline } from "@/components/agent/agent-timeline";
import { ComposerLine, FragmentLabel, TaskLine } from "@/components/marketing/ui-fragments";
import { heroPlan } from "@/components/marketing/demo-data";
import { easing, stagger } from "@/lib/motion";

/**
 * The hero demonstration: one situation becoming a reviewable plan.
 *
 * It is a timed replay of what the product actually does — the same composer,
 * the same stage timeline, the same plan shape, the same approval bar. It never
 * shows model reasoning, and it stops when it reaches the approval step rather
 * than looping forever.
 */

/** Cumulative milliseconds from the start of the sequence. */
const beats = {
  input: 250,
  stages: 700,
  /** Each stage advances on this interval once the timeline appears. */
  stageStep: 520,
  plan: 700 + 520 * heroPlan.stages.length,
} as const;

const finalStep = heroPlan.stages.length;

export function HeroDemo() {
  const reduceMotion = useReducedMotion();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // `step` walks the stage list; -1 is "nothing yet", finalStep is "plan shown".
  const [showInput, setShowInput] = useState(false);
  const [step, setStep] = useState(-1);
  const [showPlan, setShowPlan] = useState(false);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const play = useCallback(() => {
    clear();

    // Every state change is scheduled, including the reset, so the sequence is
    // driven entirely by timers and can be interrupted at any point by Replay.
    const push = (fn: () => void, at: number) => {
      timers.current.push(setTimeout(fn, at));
    };

    if (reduceMotion) {
      // No sequence — show the finished result immediately.
      push(() => {
        setShowInput(true);
        setStep(finalStep);
        setShowPlan(true);
      }, 0);
      return;
    }

    push(() => {
      setShowInput(false);
      setStep(-1);
      setShowPlan(false);
    }, 0);
    push(() => setShowInput(true), beats.input);
    heroPlan.stages.forEach((_, index) => {
      push(() => setStep(index), beats.stages + index * beats.stageStep);
    });
    push(() => {
      setStep(finalStep);
      setShowPlan(true);
    }, beats.plan);
  }, [clear, reduceMotion]);

  useEffect(() => {
    play();
    return clear;
  }, [play, clear]);

  const visibleStages = heroPlan.stages.slice(0, Math.max(0, Math.min(step + 1, finalStep)));
  const activeStage =
    step >= 0 && step < finalStep ? heroPlan.stages[step] : undefined;

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <span className="type-mono text-muted">Sonae — new situation</span>
        <button
          type="button"
          onClick={play}
          className="-my-2 inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] px-1.5 text-[0.8125rem] text-muted transition-colors duration-[var(--dur-hover)] hover:text-ink"
        >
          <RotateCcw className="size-3.5" />
          Replay
        </button>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="min-h-[4.5rem]">
          <AnimatePresence>
            {showInput ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: easing.out }}
              >
                <ComposerLine input={heroPlan.input} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Stage timeline — the only place the agent pastels appear. */}
        <div className="min-h-[2rem] border-t border-hairline-soft pt-4">
          {visibleStages.length ? (
            <AgentTimeline stages={visibleStages} activeStage={activeStage} />
          ) : (
            <p className="type-meta">Waiting for a situation.</p>
          )}
        </div>

        <AnimatePresence>
          {showPlan ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: easing.out }}
              className="space-y-4 border-t border-hairline-soft pt-4"
            >
              <div>
                <FragmentLabel>Life event</FragmentLabel>
                <p className="type-card-title mt-1">{heroPlan.event.title}</p>
                <p className="type-mono text-muted">{heroPlan.event.dates}</p>
              </div>

              <div className="border-t border-hairline-soft pt-3">
                <FragmentLabel>Tasks</FragmentLabel>
                <ul className="mt-0.5 divide-y divide-hairline-soft">
                  {heroPlan.tasks.map((task, index) => (
                    <motion.li
                      key={task.title}
                      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.2,
                        ease: easing.out,
                        delay: index * stagger.list,
                      }}
                    >
                      <TaskLine title={task.title} due={task.due} priority={task.priority} />
                    </motion.li>
                  ))}
                </ul>
              </div>

              {heroPlan.reminder ? (
                <div className="border-t border-hairline-soft pt-3">
                  <FragmentLabel>Reminder</FragmentLabel>
                  <p className="type-body mt-1 text-ink">{heroPlan.reminder}</p>
                </div>
              ) : null}

              {/* A picture of the approval bar, not a working one — the real
                  buttons live in the hero CTAs. Hidden from screen readers so
                  nobody hears a control that cannot be pressed. */}
              <div
                aria-hidden
                className="flex flex-wrap items-center gap-2 border-t border-hairline-soft pt-4"
              >
                <span className="inline-flex h-8 items-center rounded-[var(--radius-control)] bg-primary px-3 text-[0.8125rem] font-medium text-on-primary">
                  Add to Sonae
                </span>
                <span className="inline-flex h-8 items-center rounded-[var(--radius-control)] border border-hairline-strong bg-surface px-3 text-[0.8125rem] font-medium text-ink">
                  Discard plan
                </span>
              </div>
              <p className="type-meta">
                Review this plan before adding it. Sonae will not take external actions
                without your approval.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
