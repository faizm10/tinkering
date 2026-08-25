"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput, Field, Input, Select, Textarea } from "@/components/ui/field";
import type { LifeEventRecord } from "@/server/services/types";

const categories = [
  { value: "moving", label: "Moving" },
  { value: "travel", label: "Travel" },
  { value: "purchase_return", label: "Purchase return" },
  { value: "follow_up", label: "Follow up" },
  { value: "appointment", label: "Appointment" },
  { value: "document_renewal", label: "Document renewal" },
  { value: "home_maintenance", label: "Home maintenance" },
  { value: "bill_payment", label: "Bill payment" },
  { value: "school_admin", label: "School admin" },
  { value: "subscription", label: "Subscription" },
  { value: "insurance_claim", label: "Insurance claim" },
  { value: "career", label: "Career" },
  { value: "general", label: "General" },
];

type FormState = {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
};

function initialState(event?: LifeEventRecord): FormState {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    category: event?.category ?? "general",
    startDate: event?.startDate ?? "",
    endDate: event?.endDate ?? "",
  };
}

export function LifeEventForm({
  event,
  mode,
}: {
  event?: LifeEventRecord;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const baseId = useId();
  const [form, setForm] = useState(() => initialState(event));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(eventSubmit: FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    setPending(true);
    setError("");

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };
    const response = await fetch(
      mode === "create" ? "/api/life-events" : `/api/life-events/${event!.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = (await response.json()) as { eventId?: string; error?: string };

    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not save this event.");
      return;
    }

    router.push(mode === "create" ? `/events/${data.eventId}` : `/events/${event!.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="surface-card max-w-2xl space-y-5 p-4 sm:p-5">
      {error ? (
        <p role="alert" className="rounded-[var(--radius-control)] bg-error/10 px-3 py-2 text-[0.875rem] text-error">
          {error}
        </p>
      ) : null}

      <Field label="Title" htmlFor={`${baseId}-title`}>
        <Input
          id={`${baseId}-title`}
          value={form.title}
          onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))}
          required
          minLength={2}
          maxLength={120}
          autoFocus
        />
      </Field>

      <Field label="Category" htmlFor={`${baseId}-category`}>
        <Select
          id={`${baseId}-category`}
          value={form.category}
          onChange={(input) => setForm((current) => ({ ...current, category: input.target.value }))}
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description" htmlFor={`${baseId}-description`}>
        <Textarea
          id={`${baseId}-description`}
          value={form.description}
          onChange={(input) => setForm((current) => ({ ...current, description: input.target.value }))}
          maxLength={700}
          className="min-h-24"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" htmlFor={`${baseId}-start-date`}>
          <DateInput
            id={`${baseId}-start-date`}
            type="date"
            value={form.startDate}
            onChange={(input) => setForm((current) => ({ ...current, startDate: input.target.value }))}
          />
        </Field>
        <Field label="End date" htmlFor={`${baseId}-end-date`}>
          <DateInput
            id={`${baseId}-end-date`}
            type="date"
            value={form.endDate}
            onChange={(input) => setForm((current) => ({ ...current, endDate: input.target.value }))}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-hairline-soft pt-4">
        <Button type="submit" disabled={pending || form.title.trim().length < 2}>
          {pending ? "Saving..." : "Save event"}
          <Save className="size-3.5" />
        </Button>
        <Button asChild variant="ghost">
          <Link href={event ? `/events/${event.id}` : "/events"}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
