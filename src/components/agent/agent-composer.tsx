"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, PencilLine, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  AgentTimeline,
  deriveStages,
  type AgentStage,
  type ToolCallSummary,
} from "@/components/agent/agent-timeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { collapseVariants, easing } from "@/lib/motion";
import { cn } from "@/lib/utils";

const examplePrompts = [
  "I’m moving on September 1.",
  "Remind me to follow up next Monday.",
  "I have 30 days to return these headphones.",
  "I’m travelling from August 16 to August 20.",
];

const draftingLines = [
  { label: "Finding the dates", width: "w-8/12", color: "bg-agent-reading" },
  { label: "Shaping the plan", width: "w-10/12", color: "bg-agent-thinking" },
  { label: "Sorting the next steps", width: "w-7/12", color: "bg-agent-organizing" },
];

type Result = {
  proposalId: string;
  summary: string;
  clarificationQuestion?: string;
  stages: AgentStage[];
};

type AgentResponse = {
  proposalId: string;
  proposal: { summary: string; clarificationQuestions: string[]; tasks?: unknown[] };
  toolCalls?: ToolCallSummary[];
  error?: string;
};

/**
 * A command composer, not a chat window. One field, an orange submit, and —
 * once a run finishes — the real stage timeline plus a link into the plan the
 * user still has to approve.
 */
export function AgentComposer({
  autoFocus = false,
  onNavigate,
  className,
}: {
  autoFocus?: boolean;
  /** Lets a containing sheet close itself once the user moves on. */
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const fieldId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const clarificationRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const tooShort = input.trim().length < 4;

  async function run(payload: { input: string; proposalId?: string; clarificationAnswer?: string }) {
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: AgentResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Sonae could not draft a plan. Try describing the situation again.");
        return;
      }

      const clarificationQuestion = data.proposal.clarificationQuestions[0];
      setResult({
        proposalId: data.proposalId,
        summary: data.proposal.summary,
        clarificationQuestion,
        stages: deriveStages(data.toolCalls ?? [], {
          answeredClarification: Boolean(payload.clarificationAnswer),
          organizedPlan: (data.proposal.tasks?.length ?? 0) > 0,
          complete: !clarificationQuestion,
        }),
      });
      setClarificationAnswer("");
      if (clarificationQuestion) {
        requestAnimationFrame(() => clarificationRef.current?.focus());
      }
    } catch {
      setError("Sonae could not reach the planning service. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
    setInput("");
    inputRef.current?.focus();
  }

  const statusPanel = pending ? (
    <motion.div
      key="pending"
      variants={reduceMotion ? undefined : collapseVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="overflow-hidden border-t border-hairline bg-canvas-soft"
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_13rem] sm:px-5">
        <div>
          <AgentTimeline stages={["understanding"]} activeStage="understanding" />
          <p className="type-meta mt-2">Reading your situation and drafting a plan.</p>
        </div>
        <DraftingAnimation reduceMotion={Boolean(reduceMotion)} />
      </div>
    </motion.div>
  ) : error ? (
    <motion.div
      key="error"
      variants={reduceMotion ? undefined : collapseVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="overflow-hidden border-t border-hairline"
    >
      <p id={`${fieldId}-error`} role="alert" className="p-4 text-[0.875rem] text-error sm:px-5">
        {error}
      </p>
    </motion.div>
  ) : result ? (
    <motion.div
      key="result"
      variants={reduceMotion ? undefined : collapseVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="overflow-hidden border-t border-hairline bg-canvas-soft"
    >
      <div className="space-y-3 p-4 sm:px-5">
        <AgentTimeline stages={result.stages} />

        {result.clarificationQuestion ? (
          <div className="space-y-2.5">
            <p className="type-body text-ink">{result.clarificationQuestion}</p>
            <Textarea
              ref={clarificationRef}
              value={clarificationAnswer}
              onChange={(event) => setClarificationAnswer(event.target.value)}
              placeholder="Add the missing detail…"
              className="min-h-16"
              aria-label="Answer the agent’s question"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={clarificationAnswer.trim().length < 2}
                onClick={() =>
                  void run({
                    input,
                    proposalId: result.proposalId,
                    clarificationAnswer,
                  })
                }
              >
                Send detail
              </Button>
              <Button size="sm" variant="ghost" onClick={reset}>
                Start over
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="type-body text-ink">{result.summary}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <Link
                  href={`/approvals?proposal=${result.proposalId}`}
                  onClick={() => {
                    onNavigate?.();
                    router.refresh();
                  }}
                >
                  Review plan
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={reset}>
                Describe something else
              </Button>
            </div>
            <p className="type-meta">Nothing is saved until you approve it.</p>
          </>
        )}
      </div>
    </motion.div>
  ) : null;

  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="p-4 sm:p-5">
        <label htmlFor={fieldId} className="type-label">
          What’s happening?
        </label>

        <Textarea
          id={fieldId}
          ref={inputRef}
          autoFocus={autoFocus}
          value={input}
          disabled={pending}
          onChange={(event) => {
            setInput(event.target.value);
            if (result) setResult(null);
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !tooShort && !pending) {
              event.preventDefault();
              void run({ input });
            }
          }}
          placeholder="Tell Sonae what’s happening…"
          aria-describedby={error ? `${fieldId}-error` : undefined}
          aria-invalid={error ? true : undefined}
          className="mt-2.5 min-h-24 border-hairline text-[0.9375rem] leading-relaxed"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="type-meta hidden sm:block">
            Press{" "}
            <kbd className="type-mono rounded-[var(--radius-tag)] border border-hairline bg-canvas-soft px-1 py-0.5 text-ink">
              ⌘
            </kbd>{" "}
            <kbd className="type-mono rounded-[var(--radius-tag)] border border-hairline bg-canvas-soft px-1 py-0.5 text-ink">
              ↵
            </kbd>{" "}
            to draft a plan
          </p>
          <Button
            onClick={() => void run({ input })}
            disabled={pending || tooShort}
            className="ml-auto"
          >
            {pending ? (
              <>
                <Sparkles className="size-3.5 motion-safe:animate-pulse" />
                Drafting…
              </>
            ) : (
              <>
                Draft a plan
                <CornerDownLeft className="size-3.5" />
              </>
            )}
          </Button>
        </div>

        {/* Examples disappear once the field has content, so they never
            compete with what the user is writing. */}
        <AnimatePresence initial={false}>
          {!input && !result && !pending ? (
            <motion.div
              variants={reduceMotion ? undefined : collapseVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="overflow-hidden"
            >
              <ul className="flex flex-wrap gap-1.5 pt-3">
                {examplePrompts.map((prompt) => (
                  <li key={prompt}>
                    <button
                      type="button"
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="rounded-[var(--radius-pill)] border border-hairline bg-canvas-soft px-2.5 py-1 text-[0.8125rem] text-body transition-colors duration-[var(--dur-hover)] hover:border-hairline-strong hover:text-ink"
                    >
                      {prompt}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          {statusPanel}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DraftingAnimation({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div
      className="relative min-h-[7.25rem] overflow-hidden rounded-[var(--radius-control)] border border-hairline bg-surface p-3"
      aria-hidden
    >
      <motion.div
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-[var(--radius-control)] bg-primary/10 text-primary"
        animate={
          reduceMotion ? undefined : { rotate: [0, -7, 7, 0], y: [0, -1, 1, 0] }
        }
        transition={{ duration: 1.4, repeat: Infinity, ease: easing.inOut }}
      >
        <PencilLine className="size-4" />
      </motion.div>

      <div className="space-y-2.5 pr-10">
        {draftingLines.map((line, index) => (
          <div key={line.label} className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <motion.span
                className={cn("size-1.5 rounded-full", line.color)}
                animate={
                  reduceMotion
                    ? undefined
                    : { scale: [1, 1.45, 1], opacity: [0.7, 1, 0.7] }
                }
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.18,
                  ease: easing.inOut,
                }}
              />
              <span className="type-meta text-[0.75rem]">{line.label}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-[var(--radius-pill)] bg-hairline-soft">
              <motion.div
                className={cn("h-full rounded-[var(--radius-pill)]", line.color, line.width)}
                initial={reduceMotion ? false : { x: "-115%" }}
                animate={reduceMotion ? undefined : { x: ["-115%", "0%", "115%"] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: easing.inOut,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <motion.div
        className="absolute bottom-3 left-3 flex items-center gap-1.5 text-primary"
        animate={reduceMotion ? undefined : { x: [0, 5, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: easing.inOut }}
      >
        <span className="h-px w-8 bg-primary/45" />
        <span className="size-1.5 rounded-full bg-primary" />
      </motion.div>
    </div>
  );
}
