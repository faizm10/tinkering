"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreatedProject = {
  repository: string;
  publicKey: string;
  secretKey: string;
};

export function OnboardingForm() {
  const [result, setResult] = useState<CreatedProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repositoryFullName: form.get("repository"),
        allowedOrigins: [form.get("origin")],
      }),
    });
    const body = (await response.json()) as CreatedProject & { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "Could not create project");
      return;
    }
    setResult(body);
  }

  if (result) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="font-medium text-emerald-400">{result.repository} is ready</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy both keys now. The secret key is never shown again.
          </p>
        </div>
        {[
          ["Browser key", result.publicKey],
          ["Server key", result.secretKey],
        ].map(([label, value]) => (
          <div key={label} className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-2">
              <Input readOnly value={value} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => navigator.clipboard.writeText(value)}
                aria-label={`Copy ${label.toLowerCase()}`}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button asChild>
          <Link href={`/dashboard/${result.repository.split("/").at(-1)}/settings`}>
            Open tracking settings
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="repository">Repository</Label>
          <Input id="repository" name="repository" defaultValue="faizm10/aurora" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="origin">Allowed origin</Label>
          <Input id="origin" name="origin" type="url" placeholder="https://app.example.com" required />
        </div>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create analytics project"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
