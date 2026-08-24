import type { AgentProposal } from "@/lib/validations/proposal";

type ProposalReminder = AgentProposal["reminders"][number];
type ProposalTask = AgentProposal["tasks"][number];

function taskIdentifier(task: ProposalTask, index: number) {
  return task.temporaryId ?? `task_${index + 1}`;
}

function withoutTaskLink(reminder: ProposalReminder): ProposalReminder {
  const nextReminder = { ...reminder };
  delete nextReminder.relatedTaskId;
  delete nextReminder.relatedTaskIndex;
  return nextReminder;
}

export function clearProposalTasks(proposal: AgentProposal): AgentProposal {
  return {
    ...proposal,
    tasks: [],
    reminders: proposal.reminders.map(withoutTaskLink),
  };
}

export function removeProposalTask(proposal: AgentProposal, taskIndex: number): AgentProposal {
  const removedTask = proposal.tasks[taskIndex];
  if (!removedTask) return proposal;

  const removedTaskId = taskIdentifier(removedTask, taskIndex);
  const remainingTasks = proposal.tasks.filter((_, index) => index !== taskIndex);
  const nextTaskIdsByPreviousId = new Map(
    proposal.tasks
      .map((task, index) => ({ previousId: taskIdentifier(task, index), task, index }))
      .filter((entry) => entry.index !== taskIndex)
      .map((entry, nextIndex) => [entry.previousId, taskIdentifier(entry.task, nextIndex)]),
  );

  const reminders = proposal.reminders.map((reminder) => {
    const referencesRemovedTask =
      reminder.relatedTaskId === removedTaskId || reminder.relatedTaskIndex === taskIndex;
    if (referencesRemovedTask) return withoutTaskLink(reminder);

    const nextReminder = { ...reminder };
    if (nextReminder.relatedTaskId) {
      nextReminder.relatedTaskId =
        nextTaskIdsByPreviousId.get(nextReminder.relatedTaskId) ?? nextReminder.relatedTaskId;
    }
    if (typeof nextReminder.relatedTaskIndex === "number" && nextReminder.relatedTaskIndex > taskIndex) {
      nextReminder.relatedTaskIndex -= 1;
    }
    return nextReminder;
  });

  return {
    ...proposal,
    tasks: remainingTasks,
    reminders,
  };
}
