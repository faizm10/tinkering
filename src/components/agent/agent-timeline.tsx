"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { duration, easing } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The agent timeline is the one surface allowed to use the pastel stage
 * palette from design.md. Stages are derived from tool calls that actually
 * happened during the run — the component never invents progress and never
 * exposes the model's reasoning.
 */
export type AgentStage = "understanding" | "checking" | "reading" | "organizing" | "done";

const stageMeta: Record<AgentStage, { label: string; swatch: string }> = {
  understanding: { label: "Understanding", swatch: "bg-agent-thinking" },
  checking: { label: "Checking dates", swatch: "bg-agent-checking" },
  reading: { label: "Reviewing context", swatch: "bg-agent-reading" },
  organizing: { label: "Organizing", swatch: "bg-agent-organizing" },
  done: { label: "Ready", swatch: "bg-agent-done" },
};

const stageOrder: AgentStage[] = ["understanding", "checking", "reading", "organizing", "done"];

export type ToolCallSummary = { name: string };

/**
 * Maps a completed run's tool calls onto stages. A stage is only listed when
 * the work behind it took place.
 */
export function deriveStages(
  toolCalls: ToolCallSummary[],
  options: {
    answeredClarification?: boolean;
    /** True when the run actually returned a structured plan. */
    organizedPlan?: boolean;
    complete?: boolean;
  } = {},
): AgentStage[] {
  const names = new Set(toolCalls.map((call) => call.name));
  const stages: AgentStage[] = ["understanding"];

  if (names.has("get_current_date")) stages.push("checking");
  if (options.answeredClarification) stages.push("reading");
  if (options.organizedPlan || names.has("propose_life_event") || names.has("propose_task")) {
    stages.push("organizing");
  }
  if (options.complete) stages.push("done");

  return stageOrder.filter((stage) => stages.includes(stage));
}

export function AgentTimeline({
  stages,
  activeStage,
  className,
}: {
  stages: AgentStage[];
  /** The stage still in flight, rendered quieter than the finished ones. */
  activeStage?: AgentStage;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <ol
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1.5", className)}
      aria-label="Agent progress"
    >
      <AnimatePresence initial={false}>
        {stages.map((stage, index) => {
          const meta = stageMeta[stage];
          const pending = stage === activeStage;

          return (
            <motion.li
              key={stage}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.control, ease: easing.out }}
              className="flex items-center gap-2"
            >
              <span
                className={cn(
                  "type-label inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-ink",
                  pending ? "bg-hairline-soft text-muted" : meta.swatch,
                )}
              >
                {pending ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full motion-safe:animate-pulse",
                      meta.swatch,
                    )}
                    aria-hidden
                  />
                ) : null}
                {meta.label}
              </span>
              {/* Connector trails its own pill, so a wrapped line never
                  begins with an orphaned dash. */}
              {index < stages.length - 1 ? (
                <span className="h-px w-3 bg-hairline-strong" aria-hidden />
              ) : null}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
