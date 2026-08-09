"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SituationComposer() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "The agent could not create a proposal.");
        return;
      }
      router.push(`/approvals?proposal=${data.proposalId}`);
      router.refresh();
    });
  }

  return (
    <div className="border border-border bg-card p-5">
      <label htmlFor="situation" className="text-sm font-medium">
        What’s happening?
      </label>
      <textarea
        id="situation"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="I’m moving to a new house on September 1."
        className="mt-3 min-h-28 w-full resize-none border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">The agent drafts suggestions. You approve before anything is saved.</p>
        <Button type="button" onClick={submit} disabled={pending || input.trim().length < 4}>
          <Sparkles className="h-4 w-4" />
          {pending ? "Drafting" : "Create plan"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
