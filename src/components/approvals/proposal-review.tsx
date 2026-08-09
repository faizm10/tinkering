"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentProposal } from "@/lib/validations/proposal";

export function ProposalReview({ proposalId, proposal }: { proposalId: string; proposal: AgentProposal }) {
  const router = useRouter();
  const [draft, setDraft] = useState(proposal);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const response = await fetch(`/api/approvals/${proposalId}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proposal: draft }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Approval failed.");
        return;
      }
      router.push(`/events/${data.eventId}`);
      router.refresh();
    });
  }

  function reject() {
    startTransition(async () => {
      const response = await fetch(`/api/approvals/${proposalId}/reject`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Rejection failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Agent summary</p>
        <p className="mt-2 text-lg font-medium">{draft.summary}</p>
      </div>
      <div className="border border-border bg-card p-5">
        <h2 className="font-semibold">Life event</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">Title<input className="mt-2 w-full border border-input bg-background p-2" value={draft.lifeEvent.title} onChange={(event) => setDraft({ ...draft, lifeEvent: { ...draft.lifeEvent, title: event.target.value } })} /></label>
          <label className="text-sm font-medium">Category<input className="mt-2 w-full border border-input bg-background p-2" value={draft.lifeEvent.category} onChange={(event) => setDraft({ ...draft, lifeEvent: { ...draft.lifeEvent, category: event.target.value } })} /></label>
          <label className="text-sm font-medium md:col-span-2">Description<textarea className="mt-2 min-h-20 w-full border border-input bg-background p-2" value={draft.lifeEvent.description} onChange={(event) => setDraft({ ...draft, lifeEvent: { ...draft.lifeEvent, description: event.target.value } })} /></label>
          <label className="text-sm font-medium">Start date<input className="mt-2 w-full border border-input bg-background p-2" value={draft.lifeEvent.startDate ?? ""} onChange={(event) => setDraft({ ...draft, lifeEvent: { ...draft.lifeEvent, startDate: event.target.value || null } })} /></label>
          <label className="text-sm font-medium">End date<input className="mt-2 w-full border border-input bg-background p-2" value={draft.lifeEvent.endDate ?? ""} onChange={(event) => setDraft({ ...draft, lifeEvent: { ...draft.lifeEvent, endDate: event.target.value || null } })} /></label>
        </div>
      </div>
      <div className="border border-border bg-card p-5">
        <h2 className="font-semibold">Tasks</h2>
        <div className="mt-3 divide-y divide-border">
          {draft.tasks.map((task, index) => (
            <div key={`${task.title}-${index}`} className="grid gap-3 py-4 md:grid-cols-[1fr_130px_120px_44px]">
              <input className="border border-input bg-background p-2" value={task.title} onChange={(event) => {
                const tasks = [...draft.tasks];
                tasks[index] = { ...task, title: event.target.value };
                setDraft({ ...draft, tasks });
              }} />
              <select className="border border-input bg-background p-2" value={task.priority} onChange={(event) => {
                const tasks = [...draft.tasks];
                tasks[index] = { ...task, priority: event.target.value as "low" | "medium" | "high" };
                setDraft({ ...draft, tasks });
              }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input className="border border-input bg-background p-2" value={task.dueDate ?? ""} onChange={(event) => {
                const tasks = [...draft.tasks];
                tasks[index] = { ...task, dueDate: event.target.value || null };
                setDraft({ ...draft, tasks });
              }} />
              <Button variant="outline" size="icon" onClick={() => setDraft({ ...draft, tasks: draft.tasks.filter((_, taskIndex) => taskIndex !== index) })} aria-label="Remove task">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      {draft.clarificationQuestions.length ? (
        <div className="border border-border bg-card p-5">
          <h2 className="font-semibold">Clarification needed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{draft.clarificationQuestions[0]}</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button disabled={pending || draft.clarificationQuestions.length > 0} onClick={approve}>Approve everything</Button>
        <Button disabled={pending} variant="outline" onClick={reject}>Reject proposal</Button>
      </div>
    </div>
  );
}
