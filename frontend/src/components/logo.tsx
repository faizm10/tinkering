import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Activity className="size-4" strokeWidth={2.5} />
      </span>
      {!compact && <span className="font-semibold tracking-tight">RepoPulse</span>}
    </div>
  );
}
