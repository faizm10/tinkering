"use client";

import { useState, type FormEvent } from "react";
import { BarChart3, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/utils";

type GoogleAnalyticsConnection = {
  id: string;
  propertyId: string;
  propertyName: string | null;
  status: string;
  lastSyncedAt: Date | string | null;
  lastError: string | null;
};

export function GoogleAnalyticsSettings({
  repository,
  initialConnection,
}: {
  repository: string;
  initialConnection: GoogleAnalyticsConnection | null;
}) {
  const [connection, setConnection] = useState(initialConnection);
  const [pending, setPending] = useState<"connect" | "sync" | "disconnect" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("connect");
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/projects/${repository}/google-analytics`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        propertyId: form.get("propertyId"),
        propertyName: form.get("propertyName") || undefined,
        serviceAccount: form.get("serviceAccount"),
      }),
    });
    const body = (await response.json()) as {
      connection?: GoogleAnalyticsConnection;
      error?: string;
    };
    setPending(null);
    if (!response.ok || !body.connection) {
      setError(body.error ?? "Could not connect Google Analytics");
      return;
    }
    setConnection(body.connection);
  }

  async function sync() {
    setPending("sync");
    setError(null);
    const response = await fetch(`/api/projects/${repository}/google-analytics/sync`, {
      method: "POST",
    });
    setPending(null);
    if (!response.ok) {
      setError("Google Analytics sync failed");
      return;
    }
    setConnection((current) =>
      current ? { ...current, status: "connected", lastSyncedAt: new Date().toISOString() } : current,
    );
  }

  async function disconnect() {
    if (!window.confirm("Disconnect Google Analytics and delete its imported metrics?")) return;
    setPending("disconnect");
    const response = await fetch(`/api/projects/${repository}/google-analytics`, {
      method: "DELETE",
    });
    setPending(null);
    if (response.ok) setConnection(null);
    else setError("Could not disconnect Google Analytics");
  }

  if (connection) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border p-4">
          <div className="flex gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
              <BarChart3 className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{connection.propertyName ?? `GA4 ${connection.propertyId}`}</p>
                <Badge variant={connection.status === "connected" ? "success" : "outline"}>
                  {connection.status}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Property {connection.propertyId}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {connection.lastSyncedAt
                  ? `Last synced ${formatRelative(connection.lastSyncedAt)}`
                  : "Waiting for first sync"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pending !== null} onClick={sync}>
              <RefreshCw className="size-4" />
              {pending === "sync" ? "Syncing…" : "Sync now"}
            </Button>
            <Button variant="outline" size="sm" disabled={pending !== null} onClick={disconnect}>
              <Trash2 className="size-4" />
              Disconnect
            </Button>
          </div>
        </div>
        {connection.lastError ? <p className="text-sm text-rose-400">{connection.lastError}</p> : null}
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={connect}>
      <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm leading-6 text-muted-foreground">
        Create a Google Cloud service account, enable the Google Analytics Data API, then add its
        email as a Viewer on the GA4 property. Paste the downloaded JSON key below.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ga-property-id">GA4 property ID</Label>
          <Input
            id="ga-property-id"
            name="propertyId"
            inputMode="numeric"
            placeholder="123456789"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ga-property-name">Display name</Label>
          <Input
            id="ga-property-name"
            name="propertyName"
            placeholder="Production website"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ga-service-account">Service account JSON</Label>
        <Textarea
          id="ga-service-account"
          name="serviceAccount"
          className="min-h-44 font-mono text-xs"
          placeholder='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
          required
        />
        <p className="text-xs text-muted-foreground">
          The credential is encrypted before storage and is never returned to the browser.
        </p>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <Button type="submit" disabled={pending !== null}>
        <BarChart3 className="size-4" />
        {pending === "connect" ? "Connecting and importing…" : "Connect Google Analytics"}
      </Button>
    </form>
  );
}
