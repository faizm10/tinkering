"use client";

import { ErrorState } from "@/components/life-admin/states";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      message="Your data was not changed. Try loading this screen again."
      onRetry={reset}
    />
  );
}
