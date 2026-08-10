"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/sonae/states";
import { Tag } from "@/components/sonae/status-indicator";
import { TaskRow } from "@/components/tasks/task-row";
import { Button } from "@/components/ui/button";
import { DateInput, Field, Input, Select, Textarea } from "@/components/ui/field";
import { WaitingItem } from "@/components/waiting/waiting-item";
import { formatShortDate } from "@/lib/dates";
import type { ReminderRecord, TaskRecord, WaitingItemRecord } from "@/server/services/types";

type TaskFormState = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
};

type WaitingFormState = {
  title: string;
  description: string;
  waitingOn: string;
  expectedBy: string;
  followUpDate: string;
};

type ReminderFormState = {
  title: string;
  remindAt: string;
};

type Editing =
  | { type: "task"; item: TaskRecord }
  | { type: "waiting"; item: WaitingItemRecord }
  | { type: "reminder"; item: ReminderRecord }
  | null;

const emptyTask: TaskFormState = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
};

const emptyWaiting: WaitingFormState = {
  title: "",
  description: "",
  waitingOn: "",
  expectedBy: "",
  followUpDate: "",
};

const emptyReminder: ReminderFormState = {
  title: "",
  remindAt: "",
};

export function LifeEventAttachments({
  eventId,
  tasks,
  reminders,
  waiting,
}: {
  eventId: string;
  tasks: TaskRecord[];
  reminders: ReminderRecord[];
  waiting: WaitingItemRecord[];
}) {
  const router = useRouter();
  const [openForm, setOpenForm] = useState<"task" | "waiting" | "reminder" | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [deletingId, setDeletingId] = useState("");

  function startAdd(type: "task" | "waiting" | "reminder") {
    setEditing(null);
    setOpenForm((current) => (current === type ? null : type));
  }

  function startEdit(next: Editing) {
    setOpenForm(null);
    setEditing(next);
  }

  function closeForm() {
    setOpenForm(null);
    setEditing(null);
  }

  async function deleteRecord(kind: "task" | "waiting item" | "reminder", id: string, title: string) {
    const confirmed = window.confirm(`Delete "${title}"?`);
    if (!confirmed) return;

    setDeletingId(id);
    const base = kind === "task" ? "tasks" : kind === "reminder" ? "reminders" : "waiting";
    const response = await fetch(`/api/${base}/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    setDeletingId("");

    if (!response.ok) {
      toast.error(data.error ?? `Could not delete this ${kind}.`);
      return;
    }

    toast.success(`${title} deleted.`);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <section>
        <SectionHeading title="Tasks" onAdd={() => startAdd("task")} addLabel="Add task" />
        {openForm === "task" ? (
          <TaskForm eventId={eventId} mode="create" onDone={closeForm} />
        ) : null}
        {editing?.type === "task" ? (
          <TaskForm key={editing.item.id} eventId={eventId} mode="edit" task={editing.item} onDone={closeForm} />
        ) : null}
        {tasks.length ? (
          <ul className="divide-y divide-hairline-soft">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                showEventLink={false}
                actions={
                  <RowActions
                    label={task.title}
                    deleting={deletingId === task.id}
                    onEdit={() => startEdit({ type: "task", item: task })}
                    onDelete={() => deleteRecord("task", task.id, task.title)}
                  />
                }
              />
            ))}
          </ul>
        ) : (
          <EmptyState message="No tasks attached to this event." />
        )}
      </section>

      <section>
        <SectionHeading title="Reminders" onAdd={() => startAdd("reminder")} addLabel="Add reminder" />
        {openForm === "reminder" ? (
          <ReminderForm eventId={eventId} mode="create" onDone={closeForm} />
        ) : null}
        {editing?.type === "reminder" ? (
          <ReminderForm key={editing.item.id} eventId={eventId} mode="edit" reminder={editing.item} onDone={closeForm} />
        ) : null}
        {reminders.length ? (
          <ul className="divide-y divide-hairline-soft">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="flex items-start gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <p className="type-card-title min-w-0 break-words">{reminder.title}</p>
                    <Tag>{reminder.status}</Tag>
                  </div>
                  <time dateTime={reminder.remindAt} className="type-mono mt-1 block text-muted">
                    {formatShortDate(reminder.remindAt.slice(0, 10))}
                  </time>
                </div>
                <RowActions
                  label={reminder.title}
                  deleting={deletingId === reminder.id}
                  onEdit={() => startEdit({ type: "reminder", item: reminder })}
                  onDelete={() => deleteRecord("reminder", reminder.id, reminder.title)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="No reminders scheduled for this event." />
        )}
      </section>

      <section>
        <SectionHeading title="Waiting on" onAdd={() => startAdd("waiting")} addLabel="Add waiting item" />
        {openForm === "waiting" ? (
          <WaitingForm eventId={eventId} mode="create" onDone={closeForm} />
        ) : null}
        {editing?.type === "waiting" ? (
          <WaitingForm key={editing.item.id} eventId={eventId} mode="edit" item={editing.item} onDone={closeForm} />
        ) : null}
        {waiting.length ? (
          <ul className="divide-y divide-hairline-soft">
            {waiting.map((item) => (
              <WaitingItem
                key={item.id}
                item={item}
                actions={
                  <RowActions
                    label={item.title}
                    deleting={deletingId === item.id}
                    onEdit={() => startEdit({ type: "waiting", item })}
                    onDelete={() => deleteRecord("waiting item", item.id, item.title)}
                  />
                }
              />
            ))}
          </ul>
        ) : (
          <EmptyState message="Nothing here depends on someone else." />
        )}
      </section>
    </div>
  );
}

function SectionHeading({
  title,
  addLabel,
  onAdd,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-hairline pb-2.5">
      <h2 className="type-section">{title}</h2>
      <Button variant="secondary" size="sm" onClick={onAdd}>
        {addLabel}
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

function RowActions({
  label,
  deleting,
  onEdit,
  onDelete,
}: {
  label: string;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={onEdit} title={`Edit ${label}`}>
        <Pencil className="size-3.5" />
        <span className="sr-only">Edit {label}</span>
      </Button>
      <Button variant="danger" size="icon-sm" onClick={onDelete} disabled={deleting} title={`Delete ${label}`}>
        <Trash2 className="size-3.5" />
        <span className="sr-only">Delete {label}</span>
      </Button>
    </div>
  );
}

function TaskForm({
  eventId,
  mode,
  task,
  onDone,
}: {
  eventId: string;
  mode: "create" | "edit";
  task?: TaskRecord;
  onDone: () => void;
}) {
  const router = useRouter();
  const baseId = useId();
  const [form, setForm] = useState<TaskFormState>(() =>
    task
      ? {
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate ?? "",
        }
      : emptyTask,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch(mode === "create" ? "/api/tasks" : `/api/tasks/${task!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lifeEventId: eventId,
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate || null,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save this task.");
      return;
    }

    toast.success(mode === "create" ? "Task added." : "Task updated.");
    onDone();
    router.refresh();
  }

  return (
    <InlineForm title={mode === "create" ? "New task" : "Edit task"} error={error} onCancel={onDone}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor={`${baseId}-title`} className="sm:col-span-2">
          <Input
            id={`${baseId}-title`}
            value={form.title}
            onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))}
            required
            minLength={2}
            maxLength={120}
          />
        </Field>
        <Field label="Priority" htmlFor={`${baseId}-priority`}>
          <Select
            id={`${baseId}-priority`}
            value={form.priority}
            onChange={(input) =>
              setForm((current) => ({
                ...current,
                priority: input.target.value as TaskFormState["priority"],
              }))
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </Field>
        <Field label="Due date" htmlFor={`${baseId}-due`}>
          <DateInput
            id={`${baseId}-due`}
            type="date"
            value={form.dueDate}
            onChange={(input) => setForm((current) => ({ ...current, dueDate: input.target.value }))}
          />
        </Field>
        <Field label="Description" htmlFor={`${baseId}-description`} className="sm:col-span-2">
          <Textarea
            id={`${baseId}-description`}
            value={form.description}
            onChange={(input) => setForm((current) => ({ ...current, description: input.target.value }))}
            maxLength={500}
            className="min-h-20"
          />
        </Field>
        <FormActions pending={pending} disabled={form.title.trim().length < 2} />
      </form>
    </InlineForm>
  );
}

function WaitingForm({
  eventId,
  mode,
  item,
  onDone,
}: {
  eventId: string;
  mode: "create" | "edit";
  item?: WaitingItemRecord;
  onDone: () => void;
}) {
  const router = useRouter();
  const baseId = useId();
  const [form, setForm] = useState<WaitingFormState>(() =>
    item
      ? {
          title: item.title,
          description: item.description,
          waitingOn: item.waitingOn,
          expectedBy: item.expectedBy ?? "",
          followUpDate: item.followUpDate ?? "",
        }
      : emptyWaiting,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch(mode === "create" ? "/api/waiting" : `/api/waiting/${item!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lifeEventId: eventId,
        title: form.title,
        description: form.description,
        waitingOn: form.waitingOn,
        expectedBy: form.expectedBy || null,
        followUpDate: form.followUpDate || null,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save this waiting item.");
      return;
    }

    toast.success(mode === "create" ? "Waiting item added." : "Waiting item updated.");
    onDone();
    router.refresh();
  }

  return (
    <InlineForm title={mode === "create" ? "New waiting item" : "Edit waiting item"} error={error} onCancel={onDone}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor={`${baseId}-title`}>
          <Input
            id={`${baseId}-title`}
            value={form.title}
            onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))}
            required
            minLength={2}
            maxLength={120}
          />
        </Field>
        <Field label="Waiting on" htmlFor={`${baseId}-waiting-on`}>
          <Input
            id={`${baseId}-waiting-on`}
            value={form.waitingOn}
            onChange={(input) => setForm((current) => ({ ...current, waitingOn: input.target.value }))}
            required
            minLength={2}
            maxLength={120}
          />
        </Field>
        <Field label="Expected by" htmlFor={`${baseId}-expected`}>
          <DateInput
            id={`${baseId}-expected`}
            type="date"
            value={form.expectedBy}
            onChange={(input) => setForm((current) => ({ ...current, expectedBy: input.target.value }))}
          />
        </Field>
        <Field label="Follow-up date" htmlFor={`${baseId}-follow-up`}>
          <DateInput
            id={`${baseId}-follow-up`}
            type="date"
            value={form.followUpDate}
            onChange={(input) => setForm((current) => ({ ...current, followUpDate: input.target.value }))}
          />
        </Field>
        <Field label="Description" htmlFor={`${baseId}-description`} className="sm:col-span-2">
          <Textarea
            id={`${baseId}-description`}
            value={form.description}
            onChange={(input) => setForm((current) => ({ ...current, description: input.target.value }))}
            maxLength={500}
            className="min-h-20"
          />
        </Field>
        <FormActions pending={pending} disabled={form.title.trim().length < 2 || form.waitingOn.trim().length < 2} />
      </form>
    </InlineForm>
  );
}

function ReminderForm({
  eventId,
  mode,
  reminder,
  onDone,
}: {
  eventId: string;
  mode: "create" | "edit";
  reminder?: ReminderRecord;
  onDone: () => void;
}) {
  const router = useRouter();
  const baseId = useId();
  const [form, setForm] = useState<ReminderFormState>(() =>
    reminder
      ? {
          title: reminder.title,
          remindAt: toDateTimeLocal(reminder.remindAt),
        }
      : emptyReminder,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch(mode === "create" ? "/api/reminders" : `/api/reminders/${reminder!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lifeEventId: eventId,
        taskId: null,
        title: form.title,
        remindAt: new Date(form.remindAt).toISOString(),
      }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save this reminder.");
      return;
    }

    toast.success(mode === "create" ? "Reminder added." : "Reminder updated.");
    onDone();
    router.refresh();
  }

  return (
    <InlineForm title={mode === "create" ? "New reminder" : "Edit reminder"} error={error} onCancel={onDone}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor={`${baseId}-title`}>
          <Input
            id={`${baseId}-title`}
            value={form.title}
            onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))}
            required
            minLength={2}
            maxLength={120}
          />
        </Field>
        <Field label="Remind at" htmlFor={`${baseId}-remind-at`}>
          <Input
            id={`${baseId}-remind-at`}
            type="datetime-local"
            value={form.remindAt}
            onChange={(input) => setForm((current) => ({ ...current, remindAt: input.target.value }))}
            required
          />
        </Field>
        <FormActions pending={pending} disabled={form.title.trim().length < 2 || !form.remindAt} />
      </form>
    </InlineForm>
  );
}

function InlineForm({
  title,
  error,
  onCancel,
  children,
}: {
  title: string;
  error: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <div className="surface-card my-4 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="type-card-title">{title}</h3>
        <Button variant="ghost" size="icon-sm" onClick={onCancel} title="Close form">
          <X className="size-3.5" />
          <span className="sr-only">Close form</span>
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mb-4 rounded-[var(--radius-control)] bg-error/10 px-3 py-2 text-[0.875rem] text-error">
          {error}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function FormActions({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-hairline-soft pt-4 sm:col-span-2">
      <Button type="submit" disabled={pending || disabled}>
        {pending ? "Saving..." : "Save"}
        <Save className="size-3.5" />
      </Button>
    </div>
  );
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
