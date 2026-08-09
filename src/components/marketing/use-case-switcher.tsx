"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { AgentTimeline } from "@/components/agent/agent-timeline";
import { demoPlans } from "@/components/marketing/demo-data";
import { ComposerLine, FragmentLabel, TaskLine, WaitingLine } from "@/components/marketing/ui-fragments";
import { easing, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Six situations, one panel. The selector is a real tablist so arrow keys work;
 * on narrow screens it scrolls horizontally rather than collapsing into a
 * dropdown, which keeps every option one tap away.
 */
export function UseCaseSwitcher() {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const [activeId, setActiveId] = useState(demoPlans[0].id);

  const active = demoPlans.find((plan) => plan.id === activeId) ?? demoPlans[0];
  const activeIndex = demoPlans.indexOf(active);

  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;

    event.preventDefault();
    const next = demoPlans[(activeIndex + delta + demoPlans.length) % demoPlans.length];
    setActiveId(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  }

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Use cases"
        onKeyDown={onKeyDown}
        className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {demoPlans.map((plan) => {
          const selected = plan.id === active.id;
          return (
            <button
              key={plan.id}
              id={`${baseId}-tab-${plan.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(plan.id)}
              className={cn(
                "min-h-11 shrink-0 rounded-[var(--radius-control)] border px-3.5 text-sm font-medium",
                "transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out)]",
                selected
                  ? "border-ink bg-ink text-canvas"
                  : "border-hairline-strong bg-surface text-body hover:border-ink/30 hover:text-ink",
              )}
            >
              {plan.label}
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-label={`${active.label} example`}
        className="surface-card overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: easing.out }}
            className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2 lg:gap-10"
          >
            <div className="space-y-4">
              <ComposerLine input={active.input} />
              <div className="border-t border-hairline-soft pt-4">
                <AgentTimeline stages={active.stages} />
              </div>
            </div>

            <div className="space-y-4 border-t border-hairline-soft pt-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div>
                <FragmentLabel>Life event</FragmentLabel>
                <p className="type-card-title mt-1">{active.event.title}</p>
                <p className="type-mono text-muted">{active.event.dates}</p>
              </div>

              <div>
                <FragmentLabel>Tasks</FragmentLabel>
                <ul className="mt-0.5 divide-y divide-hairline-soft">
                  {active.tasks.map((task, index) => (
                    <motion.li
                      key={task.title}
                      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.18,
                        ease: easing.out,
                        delay: 0.05 + index * stagger.list,
                      }}
                    >
                      <TaskLine title={task.title} due={task.due} priority={task.priority} />
                    </motion.li>
                  ))}
                </ul>
              </div>

              {active.reminder ? (
                <div className="border-t border-hairline-soft pt-3">
                  <FragmentLabel>Reminder</FragmentLabel>
                  <p className="type-body mt-1 text-ink">{active.reminder}</p>
                </div>
              ) : null}

              {active.waiting ? (
                <div className="border-t border-hairline-soft pt-1">
                  <FragmentLabel>Waiting on</FragmentLabel>
                  <WaitingLine
                    duration="2 days"
                    title={active.waiting.title}
                    on={active.waiting.on}
                    followUp="Aug 11"
                  />
                </div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
