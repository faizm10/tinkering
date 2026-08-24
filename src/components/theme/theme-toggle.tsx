"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import type { Theme } from "@/lib/theme";

const options: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "grid w-full grid-cols-2 gap-1 rounded-[var(--radius-control)] border border-hairline bg-surface p-1 sm:w-fit",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex h-9 min-w-24 items-center justify-center gap-2 rounded-[6px] px-3 text-sm font-medium",
              "transition-[background-color,color] duration-[var(--dur-hover)] ease-[var(--ease-out)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              active ? "bg-ink text-canvas" : "text-body hover:bg-hairline-soft hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
