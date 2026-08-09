import type { AgentProposal } from "@/lib/validations/proposal";
import type { LifeEventSummary, TaskRecord } from "@/server/services/types";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export type DuplicateMatch = {
  entityType: "life_event" | "task";
  id: string;
  title: string;
  reason: string;
};

export function detectDuplicateEvent(proposal: AgentProposal, events: LifeEventSummary[]): DuplicateMatch | null {
  const title = normalize(proposal.lifeEvent.title);
  const category = normalize(proposal.lifeEvent.category);
  const date = proposal.lifeEvent.endDate ?? proposal.lifeEvent.startDate;
  const match = events.find((event) => {
    const sameCategory = normalize(event.category) === category;
    const sameDate = Boolean(date && (event.endDate === date || event.startDate === date));
    const eventTitle = normalize(event.title);
    const titleOverlap = eventTitle === title || eventTitle.includes(title) || title.includes(eventTitle);
    return event.status === "active" && (titleOverlap || (sameCategory && sameDate));
  });
  return match ? { entityType: "life_event", id: match.id, title: match.title, reason: "Likely duplicate active life event." } : null;
}

export function detectDuplicateTasks(proposal: AgentProposal, tasks: TaskRecord[]): DuplicateMatch[] {
  const openTasks = tasks.filter((task) => task.status !== "completed");
  return proposal.tasks.flatMap((candidate) => {
    const normalized = normalize(candidate.title);
    const match = openTasks.find((task) => normalize(task.title) === normalized && task.dueDate === (candidate.dueDate ?? null));
    return match ? [{ entityType: "task" as const, id: match.id, title: match.title, reason: "Likely duplicate open task." }] : [];
  });
}
