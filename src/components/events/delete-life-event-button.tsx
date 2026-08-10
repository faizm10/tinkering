"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DeleteLifeEventButton({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function deleteEvent() {
    const confirmed = window.confirm(`Delete "${eventTitle}"? Tasks and waiting items will stay in Sonae without this event.`);
    if (!confirmed) return;

    setPending(true);
    setError("");
    const response = await fetch(`/api/life-events/${eventId}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not delete this event.");
      return;
    }

    router.push("/events");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button variant="danger" size="sm" onClick={deleteEvent} disabled={pending}>
        {pending ? "Deleting..." : "Delete"}
        <Trash2 className="size-3.5" />
      </Button>
      {error ? <p role="alert" className="max-w-52 text-[0.8125rem] text-error">{error}</p> : null}
    </div>
  );
}
