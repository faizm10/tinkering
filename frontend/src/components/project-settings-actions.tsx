"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OriginSettings({ repository }: { repository: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const origins = String(form.get("origins"))
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    const response = await fetch(`/api/projects/${repository}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ allowedOrigins: origins }),
    });
    setPending(false);
    setMessage(response.ok ? "Origins saved" : "Could not save origins");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="origins">Origins</Label>
        <Input
          id="origins"
          name="origins"
          defaultValue="https://app.example.com, http://localhost:3000"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save origins"}
        </Button>
        {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
      </div>
    </form>
  );
}

export function KeyRotation({ repository }: { repository: string }) {
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [pendingKind, setPendingKind] = useState<"public" | "secret" | null>(null);

  async function rotate(kind: "public" | "secret") {
    setPendingKind(kind);
    const response = await fetch(`/api/projects/${repository}/keys`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const body = (await response.json()) as { key?: string };
    setPendingKind(null);
    if (response.ok && body.key) setRevealedKey(body.key);
  }

  return (
    <div className="space-y-4">
      {(["public", "secret"] as const).map((kind) => (
        <div key={kind} className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <KeyRound className="size-4 text-muted-foreground" />
            <div>
              <p className="font-mono text-xs">rp_{kind === "public" ? "pub" : "sec"}_{repository}_••••••</p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">{kind} key · active</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingKind !== null}
            onClick={() => rotate(kind)}
          >
            <RotateCw className="size-4" />
            {pendingKind === kind ? "Rotating…" : "Rotate"}
          </Button>
        </div>
      ))}
      {revealedKey ? (
        <div className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
          <Label>Copy the new key now</Label>
          <div className="flex gap-2">
            <Input readOnly value={revealedKey} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigator.clipboard.writeText(revealedKey)}
              aria-label="Copy new tracking key"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DeleteProject({ repository }: { repository: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete all analytics data for ${repository}? This cannot be undone.`)) return;
    setPending(true);
    const response = await fetch(`/api/projects/${repository}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setPending(false);
  }

  return (
    <Button type="button" variant="destructive" disabled={pending} onClick={remove}>
      <Trash2 className="size-4" />
      {pending ? "Deleting…" : "Delete repository data"}
    </Button>
  );
}
