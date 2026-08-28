import type { UIMessage } from "ai";

export type AssistantLedgerTone = "today" | "upcoming" | "waiting" | "proposal" | "note";

export type AssistantLedgerItem = {
  id: string;
  tone: AssistantLedgerTone;
  label: string;
  title: string;
  detail?: string;
  href?: string;
};

export type AssistantProposalPart = {
  proposalId: string;
  title: string;
  summary: string;
  tasksCount: number;
  remindersCount: number;
  waitingCount: number;
};

export type SonaeChatMetadata = {
  createdAt?: string;
  provider?: "mock" | "gateway";
  model?: string;
};

export type SonaeChatDataParts = {
  ledger: { items: AssistantLedgerItem[] };
  proposal: AssistantProposalPart;
};

export type SonaeChatMessage = UIMessage<SonaeChatMetadata, SonaeChatDataParts>;
