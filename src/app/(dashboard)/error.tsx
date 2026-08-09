"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">Your data was not changed. Try loading this screen again.</p>
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}
