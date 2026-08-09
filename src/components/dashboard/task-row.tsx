"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { TaskRecord } from "@/server/services/types";
import { Button } from "@/components/ui/button";

export function TaskRow({ task }: { task: TaskRecord }) {
  const router = useRouter();

  async function toggle() {
    const endpoint = task.status === "completed" ? "reopen" : "complete";
    await fetch(`/api/tasks/${task.id}/${endpoint}`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{task.title}</p>
          <span className="border border-border px-2 py-0.5 text-xs text-muted-foreground">{task.priority}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
        {task.dueDate ? <p className="mt-1 text-xs text-muted-foreground">Due {task.dueDate}</p> : null}
      </div>
      <Button variant="outline" size="icon" onClick={toggle} aria-label={task.status === "completed" ? "Reopen task" : "Complete task"}>
        {task.status === "completed" ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
