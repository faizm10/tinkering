"use client";

import { AnimatePresence } from "motion/react";

import { TaskRow } from "@/components/tasks/task-row";
import { cn } from "@/lib/utils";
import type { LifeEventRecord, TaskRecord } from "@/server/services/types";

/**
 * A hairline-separated list of tasks. Wrapped in AnimatePresence so completing
 * a task that leaves the group animates out rather than vanishing.
 */
export function TaskGroup({
  tasks,
  events = [],
  showEventLink = true,
  className,
}: {
  tasks: TaskRecord[];
  events?: Pick<LifeEventRecord, "id" | "title">[];
  showEventLink?: boolean;
  className?: string;
}) {
  const titleById = new Map(events.map((event) => [event.id, event.title]));

  return (
    <ul className={cn("divide-y divide-hairline-soft", className)}>
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            eventTitle={task.lifeEventId ? titleById.get(task.lifeEventId) : undefined}
            showEventLink={showEventLink}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
