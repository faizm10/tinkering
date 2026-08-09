import { agentProposalSchema, type AgentProposal, type ProposalCategory } from "@/lib/validations/proposal";
import { AgentValidationError } from "@/server/agent/errors";
import type { DuplicateMatch } from "@/server/agent/duplicate-detector";

type BuildLifeEvent = AgentProposal["lifeEvent"];
type BuildTask = AgentProposal["tasks"][number];
type BuildReminder = AgentProposal["reminders"][number];
type BuildWaitingItem = AgentProposal["waitingItems"][number];

function uniqByTitle<T extends { title: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class ProposalBuilder {
  private lifeEvent: BuildLifeEvent | null = null;
  private tasks: BuildTask[] = [];
  private reminders: BuildReminder[] = [];
  private waitingItems: BuildWaitingItem[] = [];
  private clarificationQuestions: string[] = [];
  private assumptions: string[] = [];
  private duplicateMatches: DuplicateMatch[] = [];
  private finalized = false;

  setLifeEvent(input: BuildLifeEvent) {
    this.lifeEvent = input;
  }

  addTask(input: Omit<BuildTask, "temporaryId"> & { temporaryId?: string }) {
    if (this.tasks.length >= 12) return;
    this.tasks.push({ temporaryId: input.temporaryId ?? `task_${this.tasks.length + 1}`, ...input });
  }

  addReminder(input: Omit<BuildReminder, "temporaryId"> & { temporaryId?: string }) {
    if (this.reminders.length >= 5) return;
    this.reminders.push({ temporaryId: input.temporaryId ?? `reminder_${this.reminders.length + 1}`, ...input });
  }

  addWaitingItem(input: Omit<BuildWaitingItem, "temporaryId"> & { temporaryId?: string }) {
    if (this.waitingItems.length >= 5) return;
    this.waitingItems.push({ temporaryId: input.temporaryId ?? `waiting_${this.waitingItems.length + 1}`, ...input });
  }

  askClarification(question: string) {
    this.clarificationQuestions = [question];
  }

  addAssumption(assumption: string) {
    if (this.assumptions.length < 5) this.assumptions.push(assumption);
  }

  addDuplicate(match: DuplicateMatch) {
    this.duplicateMatches.push(match);
  }

  finalize(summary: string, category: ProposalCategory = this.lifeEvent?.category ?? "general", confidence: AgentProposal["confidence"] = "medium") {
    if (this.finalized) throw new AgentValidationError("Proposal was finalized more than once.");
    this.finalized = true;
    if (!this.lifeEvent) throw new AgentValidationError("Cannot finalize without a life event.");
    const duplicateAssumptions = this.duplicateMatches.map((match) => `Possible duplicate ${match.entityType.replace("_", " ")}: ${match.title}.`);
    return agentProposalSchema.parse({
      version: 1,
      summary,
      category,
      confidence,
      assumptions: [...this.assumptions, ...duplicateAssumptions],
      lifeEvent: this.lifeEvent,
      tasks: uniqByTitle(this.tasks),
      reminders: uniqByTitle(this.reminders),
      waitingItems: uniqByTitle(this.waitingItems),
      clarificationQuestions: this.clarificationQuestions,
    });
  }
}
