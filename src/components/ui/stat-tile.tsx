"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatTileTone = "default" | "primary" | "success" | "warning";

const TONE_ICON_CLASS: Record<StatTileTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success:
    "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
};

type StatTileProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  tone?: StatTileTone;
  className?: string;
};

/** Compact KPI tile: tinted icon square, muted label, large tabular value. */
export function StatTile({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = "default",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40 sm:p-4",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          TONE_ICON_CLASS[tone]
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums leading-tight sm:text-xl">
          {value}
        </p>
        {sublabel && (
          <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
