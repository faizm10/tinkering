import "server-only";

import type { AssistantLedgerItem, SonaeChatMessage } from "@/lib/agent/chat-types";
import type { DataRepository } from "@/server/providers/data/repository";
import type { AgentMessageRecord, DashboardData } from "@/server/services/types";

const draftSignals = [
  "create a plan",
  "draft a plan",
  "make a plan",
  "plan for",
  "help me plan",
  "organize this",
  "i am moving",
  "i'm moving",
  "i will be moving",
  "i’m moving",
];

export function titleFromInput(input: string) {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) return "Ask Sonae";
  return normalized.length > 54 ? `${normalized.slice(0, 51).trim()}...` : normalized;
}

export function textFromMessage(message: SonaeChatMessage | undefined) {
  return (
    message?.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim() ?? ""
  );
}

export function toChatMessage(record: AgentMessageRecord): SonaeChatMessage {
  return {
    id: record.id,
    role: record.role,
    metadata: {
      ...(record.metadataJson as SonaeChatMessage["metadata"]),
      createdAt: typeof record.metadataJson.createdAt === "string" ? record.metadataJson.createdAt : record.createdAt,
    },
    parts: record.partsJson as SonaeChatMessage["parts"],
  };
}

export function shouldDraftProposal(input: string) {
  const lower = input.toLowerCase();
  return draftSignals.some((signal) => lower.includes(signal));
}

function dueLabel(date: string | null) {
  return date ? `Due ${date}` : "No date set";
}

function contextLedger(data: DashboardData): AssistantLedgerItem[] {
  const today = data.today.slice(0, 3).map((task) => ({
    id: `today-${task.id}`,
    tone: "today" as const,
    label: "Today",
    title: task.title,
    detail: dueLabel(task.dueDate),
    href: "/tasks",
  }));
  const upcoming = data.upcoming.slice(0, 3).map((task) => ({
    id: `upcoming-${task.id}`,
    tone: "upcoming" as const,
    label: "Upcoming",
    title: task.title,
    detail: dueLabel(task.dueDate),
    href: "/tasks",
  }));
  const waiting = data.waiting.slice(0, 2).map((item) => ({
    id: `waiting-${item.id}`,
    tone: "waiting" as const,
    label: "Waiting",
    title: item.title,
    detail: item.followUpDate ? `Follow up ${item.followUpDate}` : `Waiting on ${item.waitingOn}`,
    href: "/waiting",
  }));

  return [...today, ...upcoming, ...waiting];
}

function contextSummary(data: DashboardData) {
  const lines = [
    data.today.length
      ? `Today has ${data.today.length} open ${data.today.length === 1 ? "task" : "tasks"}.`
      : "Today is clear.",
    data.upcoming.length
      ? `${data.upcoming.length} upcoming ${data.upcoming.length === 1 ? "task needs" : "tasks need"} attention after today.`
      : "No upcoming tasks are scheduled beyond today.",
    data.waiting.length
      ? `${data.waiting.length} ${data.waiting.length === 1 ? "item is" : "items are"} waiting on someone else.`
      : "Nothing is waiting on someone else.",
  ];

  return lines.join(" ");
}

export async function buildMockAssistantReply({
  userId,
  input,
  repository,
}: {
  userId: string;
  input: string;
  repository: DataRepository;
}) {
  const data = await repository.getDashboardData(userId);
  const ledger = contextLedger(data);

  if (shouldDraftProposal(input)) {
    const { createAgentProposal } = await import("@/server/agent/agent");
    const result = await createAgentProposal(userId, { input });
    const proposal = result.proposal;
    return {
      text: proposal.clarificationQuestions[0]
        ? `I need one detail before I can finish the plan: ${proposal.clarificationQuestions[0]}`
        : `I drafted a plan for ${proposal.lifeEvent.title}. Review it before anything is saved.`,
      ledger: [
        {
          id: `proposal-${result.proposalId}`,
          tone: "proposal" as const,
          label: "Draft plan",
          title: proposal.lifeEvent.title,
          detail: `${proposal.tasks.length} tasks, ${proposal.reminders.length} reminders, ${proposal.waitingItems.length} waiting items`,
          href: `/approvals?proposal=${result.proposalId}`,
        },
        ...ledger.slice(0, 4),
      ],
      proposal: {
        proposalId: result.proposalId,
        title: proposal.lifeEvent.title,
        summary: proposal.summary,
        tasksCount: proposal.tasks.length,
        remindersCount: proposal.reminders.length,
        waitingCount: proposal.waitingItems.length,
      },
      model: "mock-sonae-chat-v1",
    };
  }

  const lower = input.toLowerCase();
  const asksToday = lower.includes("today") || lower.includes("do i need") || lower.includes("what should");
  const asksWaiting = lower.includes("waiting") || lower.includes("follow up");

  return {
    text: asksToday || asksWaiting
      ? `${contextSummary(data)} I pulled the most relevant items into the ledger below.`
      : `I can help you review what needs attention or turn a new situation into a draft plan. ${contextSummary(data)}`,
    ledger,
    proposal: null,
    model: "mock-sonae-chat-v1",
  };
}
