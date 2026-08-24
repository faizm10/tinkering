"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { DateInput, Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatShortDate } from "@/lib/dates";
import { collapseVariants, itemVariants, listVariants, transition } from "@/lib/motion";
import { clearProposalTasks, removeProposalTask } from "@/lib/proposal-draft";
import type { AgentProposal, ProposalCategory } from "@/lib/validations/proposal";

/**
 * A proposal is presented as an editable plan, not a chat reply. Every field
 * the agent filled in can be corrected here, and nothing is written until the
 * user presses the one orange button on the page.
 */
export function ProposalReview({
  proposalId,
  proposal,
}: {
  proposalId: string;
  proposal: AgentProposal;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState(proposal);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const blockedByQuestion = draft.clarificationQuestions.length > 0;

  const importantDates = [
    draft.lifeEvent.startDate ? { label: "Starts", value: draft.lifeEvent.startDate } : null,
    draft.lifeEvent.endDate ? { label: "Ends", value: draft.lifeEvent.endDate } : null,
    ...draft.tasks
      .filter((task) => task.dueDate)
      .map((task) => ({ label: task.title, value: task.dueDate as string })),
  ].filter(Boolean) as { label: string; value: string }[];

  function approve() {
    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/approvals/${proposalId}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proposal: draft }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Sonae could not save this plan.");
        return;
      }
      router.push(`/events/${data.eventId}`);
      router.refresh();
    });
  }

  function discard() {
    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/approvals/${proposalId}/reject`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Sonae could not discard this plan.");
        return;
      }
      router.push("/approvals");
      router.refresh();
    });
  }

  return (
    <motion.div
      variants={reduceMotion ? undefined : listVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.section variants={reduceMotion ? undefined : itemVariants} className="space-y-2">
        <h2 className="type-label">Summary</h2>
        <p className="type-display-lg max-w-3xl">{draft.summary}</p>
      </motion.section>

      {blockedByQuestion ? (
        <motion.section
          variants={reduceMotion ? undefined : itemVariants}
          className="surface-card p-4 sm:p-5"
        >
          <h2 className="type-label">Sonae needs one detail</h2>
          <p className="type-body mt-1.5 text-ink">{draft.clarificationQuestions[0]}</p>
          <p className="type-meta mt-2">
            Answer it in the composer on the dashboard, or fill in the dates below yourself and
            dismiss the question.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => setDraft({ ...draft, clarificationQuestions: [] })}
          >
            I’ve filled this in
          </Button>
        </motion.section>
      ) : null}

      <motion.section variants={reduceMotion ? undefined : itemVariants}>
        <h2 className="type-section border-b border-hairline pb-2.5">Life event</h2>
        <div className="grid gap-4 pt-4 md:grid-cols-2">
          <Field label="Title" htmlFor="event-title">
            <Input
              id="event-title"
              value={draft.lifeEvent.title}
              onChange={(event) =>
                setDraft({ ...draft, lifeEvent: { ...draft.lifeEvent, title: event.target.value } })
              }
            />
          </Field>
          <Field label="Category" htmlFor="event-category">
            <Input
              id="event-category"
              value={draft.lifeEvent.category}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  lifeEvent: { ...draft.lifeEvent, category: event.target.value as ProposalCategory },
                })
              }
            />
          </Field>
          <Field label="Description" htmlFor="event-description" className="md:col-span-2">
            <Textarea
              id="event-description"
              className="min-h-20"
              value={draft.lifeEvent.description}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  lifeEvent: { ...draft.lifeEvent, description: event.target.value },
                })
              }
            />
          </Field>
          <Field label="Start date" htmlFor="event-start">
            <DateInput
              id="event-start"
              value={draft.lifeEvent.startDate ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  lifeEvent: { ...draft.lifeEvent, startDate: event.target.value || null },
                })
              }
            />
          </Field>
          <Field label="End date" htmlFor="event-end">
            <DateInput
              id="event-end"
              value={draft.lifeEvent.endDate ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  lifeEvent: { ...draft.lifeEvent, endDate: event.target.value || null },
                })
              }
            />
          </Field>
        </div>
      </motion.section>

      <motion.section variants={reduceMotion ? undefined : itemVariants}>
        <SectionHead
          title="Tasks"
          count={draft.tasks.length}
          action={
            draft.tasks.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDraft(clearProposalTasks(draft))}
                disabled={pending}
                aria-label="Clear all generated tasks"
              >
                <Trash2 className="size-4" />
                Clear all
              </Button>
            ) : null
          }
        />
        {draft.tasks.length === 0 ? (
          <p className="type-meta py-4">No tasks in this plan.</p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            <AnimatePresence initial={false}>
              {draft.tasks.map((task, index) => (
                <EditableRow
                  key={`task-${index}`}
                  onRemove={() => setDraft(removeProposalTask(draft, index))}
                  removeLabel={`Remove task ${task.title}`}
                  reduceMotion={Boolean(reduceMotion)}
                >
                  <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_120px_140px]">
                    <Input
                      aria-label={`Task ${index + 1} title`}
                      value={task.title}
                      onChange={(event) => {
                        const tasks = [...draft.tasks];
                        tasks[index] = { ...task, title: event.target.value };
                        setDraft({ ...draft, tasks });
                      }}
                    />
                    <Select
                      aria-label={`Task ${index + 1} priority`}
                      value={task.priority}
                      onChange={(event) => {
                        const tasks = [...draft.tasks];
                        tasks[index] = {
                          ...task,
                          priority: event.target.value as "low" | "medium" | "high",
                        };
                        setDraft({ ...draft, tasks });
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                    <DateInput
                      aria-label={`Task ${index + 1} due date`}
                      value={task.dueDate ?? ""}
                      onChange={(event) => {
                        const tasks = [...draft.tasks];
                        tasks[index] = { ...task, dueDate: event.target.value || null };
                        setDraft({ ...draft, tasks });
                      }}
                    />
                  </div>
                </EditableRow>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>

      <motion.section variants={reduceMotion ? undefined : itemVariants}>
        <SectionHead title="Reminders" count={draft.reminders.length} />
        {draft.reminders.length === 0 ? (
          <p className="type-meta py-4">No reminders in this plan.</p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            <AnimatePresence initial={false}>
              {draft.reminders.map((reminder, index) => (
                <EditableRow
                  key={`reminder-${index}`}
                  onRemove={() =>
                    setDraft({
                      ...draft,
                      reminders: draft.reminders.filter((_, i) => i !== index),
                    })
                  }
                  removeLabel={`Remove reminder ${reminder.title}`}
                  reduceMotion={Boolean(reduceMotion)}
                >
                  <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_200px]">
                    <Input
                      aria-label={`Reminder ${index + 1} title`}
                      value={reminder.title}
                      onChange={(event) => {
                        const reminders = [...draft.reminders];
                        reminders[index] = { ...reminder, title: event.target.value };
                        setDraft({ ...draft, reminders });
                      }}
                    />
                    <Input
                      type="datetime-local"
                      aria-label={`Reminder ${index + 1} time`}
                      className="type-mono"
                      value={toLocalInput(reminder.remindAt)}
                      onChange={(event) => {
                        const reminders = [...draft.reminders];
                        const parsed = new Date(event.target.value);
                        if (Number.isNaN(parsed.getTime())) return;
                        reminders[index] = { ...reminder, remindAt: parsed.toISOString() };
                        setDraft({ ...draft, reminders });
                      }}
                    />
                  </div>
                </EditableRow>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>

      <motion.section variants={reduceMotion ? undefined : itemVariants}>
        <SectionHead title="Waiting on" count={draft.waitingItems.length} />
        {draft.waitingItems.length === 0 ? (
          <p className="type-meta py-4">Nothing in this plan depends on someone else.</p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            <AnimatePresence initial={false}>
              {draft.waitingItems.map((item, index) => (
                <EditableRow
                  key={`waiting-${index}`}
                  onRemove={() =>
                    setDraft({
                      ...draft,
                      waitingItems: draft.waitingItems.filter((_, i) => i !== index),
                    })
                  }
                  removeLabel={`Remove waiting item ${item.title}`}
                  reduceMotion={Boolean(reduceMotion)}
                >
                  <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1fr_140px]">
                    <Input
                      aria-label={`Waiting item ${index + 1} title`}
                      value={item.title}
                      onChange={(event) => {
                        const waitingItems = [...draft.waitingItems];
                        waitingItems[index] = { ...item, title: event.target.value };
                        setDraft({ ...draft, waitingItems });
                      }}
                    />
                    <Input
                      aria-label={`Waiting item ${index + 1} is waiting on`}
                      value={item.waitingOn}
                      onChange={(event) => {
                        const waitingItems = [...draft.waitingItems];
                        waitingItems[index] = { ...item, waitingOn: event.target.value };
                        setDraft({ ...draft, waitingItems });
                      }}
                    />
                    <DateInput
                      aria-label={`Waiting item ${index + 1} follow-up date`}
                      value={item.followUpDate ?? ""}
                      onChange={(event) => {
                        const waitingItems = [...draft.waitingItems];
                        waitingItems[index] = { ...item, followUpDate: event.target.value || null };
                        setDraft({ ...draft, waitingItems });
                      }}
                    />
                  </div>
                </EditableRow>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>

      {importantDates.length ? (
        <motion.section variants={reduceMotion ? undefined : itemVariants}>
          <SectionHead title="Important dates" />
          <ul className="divide-y divide-hairline-soft">
            {importantDates.map((entry) => (
              <li
                key={`${entry.label}-${entry.value}`}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                <span className="type-body min-w-0 truncate text-body">{entry.label}</span>
                <time dateTime={entry.value} className="type-mono shrink-0 text-ink">
                  {formatShortDate(entry.value)}
                </time>
              </li>
            ))}
          </ul>
        </motion.section>
      ) : null}

      <motion.div
        variants={reduceMotion ? undefined : itemVariants}
        className="sticky bottom-20 z-20 border-t border-hairline bg-canvas/95 pt-4 backdrop-blur-sm lg:bottom-0 lg:pb-4"
      >
        <p className="type-meta max-w-2xl">
          Review this plan before adding it. Sonae will not take external actions without your
          approval.
        </p>
        {error ? (
          <p role="alert" className="mt-2 text-[0.875rem] text-error">
            {error}
          </p>
        ) : null}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button onClick={approve} disabled={pending || blockedByQuestion}>
            {pending ? "Adding…" : "Add to Sonae"}
          </Button>
          <Button variant="secondary" onClick={discard} disabled={pending}>
            Discard plan
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionHead({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-hairline pb-2.5">
      <div className="flex items-baseline gap-2.5">
        <h2 className="type-section">{title}</h2>
        {typeof count === "number" && count > 0 ? (
          <span className="type-mono text-muted" aria-hidden>
            {count}
          </span>
        ) : null}
      </div>
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  );
}

function EditableRow({
  children,
  onRemove,
  removeLabel,
  reduceMotion,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.li
      layout={!reduceMotion}
      variants={reduceMotion ? undefined : collapseVariants}
      initial={false}
      animate="visible"
      exit="exit"
      transition={transition.layout}
      className="group/row flex items-start gap-2 overflow-hidden py-3"
    >
      {children}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        className="mt-0.5 shrink-0 text-muted hover:text-error"
      >
        <X className="size-4" />
        <span className="sr-only">{removeLabel}</span>
      </Button>
    </motion.li>
  );
}

/** `datetime-local` needs a local, second-less value — not an ISO string. */
function toLocalInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
