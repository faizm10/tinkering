"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { DateDisplay } from "@/components/life-admin/date-display";
import { PriorityLabel } from "@/components/life-admin/status-indicator";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { TaskRecord } from "@/server/services/types";

/**
 * A flat row, not a card. Hairlines from the parent list do the separating;
 * secondary detail is revealed on hover and always present for keyboard and
 * screen-reader users.
 */
export function TaskRow({
  task,
  eventTitle,
  showEventLink = true,
}: {
  task: TaskRecord;
  eventTitle?: string;
  /** Off inside an event's own task list, where the link is redundant. */
  showEventLink?: boolean;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [, startTransition] = useTransition();
  const [completed, setCompleted] = useState(task.status === "completed");
  const [error, setError] = useState("");

  function toggle() {
    const next = !completed;
    // Flip immediately — the row should feel finished before the round trip.
    setCompleted(next);
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/tasks/${task.id}/${next ? "complete" : "reopen"}`, {
        method: "POST",
      });

      if (!response.ok) {
        setCompleted(!next);
        setError("Could not update this task.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <motion.li
      layout={!reduceMotion}
      transition={transition.layout}
      className="group/task flex items-start gap-3 py-3"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        onClick={toggle}
        className={cn(
          "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border",
          "transition-[background-color,border-color] duration-[var(--dur-control)] ease-[var(--ease-out)]",
          completed
            ? "border-ink bg-ink text-canvas"
            : "border-hairline-strong bg-surface hover:border-ink",
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: completed ? 1 : 0, opacity: completed ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : transition.control}
          className="grid place-items-center"
        >
          <Check className="size-3" strokeWidth={3} />
        </motion.span>
        <span className="sr-only">
          {completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <motion.p
            initial={false}
            animate={{ opacity: completed ? 0.5 : 1 }}
            transition={reduceMotion ? { duration: 0 } : transition.control}
            className={cn(
              "type-card-title min-w-0 break-words",
              completed && "line-through decoration-muted-soft",
            )}
          >
            {task.title}
          </motion.p>
          {!completed ? <PriorityLabel priority={task.priority} /> : null}
        </div>

        {task.description ? (
          <p className="type-meta mt-0.5 line-clamp-2">{task.description}</p>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {task.dueDate && !completed ? <DateDisplay date={task.dueDate} /> : null}
          {completed && task.completedAt ? (
            <span className="type-mono text-muted-soft">Completed</span>
          ) : null}
          {showEventLink && task.lifeEventId && eventTitle ? (
            <Link
              href={`/events/${task.lifeEventId}`}
              className="text-[0.8125rem] text-muted underline decoration-hairline-strong underline-offset-2 transition-colors duration-[var(--dur-hover)] hover:text-ink hover:decoration-ink"
            >
              {eventTitle}
            </Link>
          ) : null}
          {task.source === "agent" ? (
            <span className="type-meta opacity-0 transition-opacity duration-[var(--dur-hover)] group-hover/task:opacity-100 group-focus-within/task:opacity-100">
              Suggested by Life Admin
            </span>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="mt-1 text-[0.8125rem] text-error">
            {error}
          </p>
        ) : null}
      </div>
    </motion.li>
  );
}
