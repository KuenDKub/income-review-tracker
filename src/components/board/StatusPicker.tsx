"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { REVIEW_JOB_STATUSES } from "@/lib/schemas/reviewJob";
import { cn } from "@/lib/utils";
import { statusTheme, STATUS_KEYS } from "./statusTheme";

type StatusPickerProps = {
  current: string;
  onSelect: (status: string) => void;
  disabled?: boolean;
};

export function StatusPicker({ current, onSelect, disabled }: StatusPickerProps) {
  const t = useTranslations("jobs");

  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {REVIEW_JOB_STATUSES.map((status) => {
        const active = status === current;
        const theme = statusTheme(status);
        return (
          <button
            key={status}
            type="button"
            disabled={disabled || active}
            aria-pressed={active}
            className={cn(
              "flex min-h-[44px] cursor-pointer touch-manipulation items-center gap-2.5 rounded-lg border px-3 text-left text-sm font-medium transition-colors active:scale-[0.98] disabled:cursor-default",
              active
                ? cn(theme.badge, "border-2")
                : "border-border bg-card hover:bg-muted disabled:opacity-50"
            )}
            onClick={() => onSelect(status)}
          >
            <span
              aria-hidden
              className={cn("size-2.5 shrink-0 rounded-full", theme.dot)}
            />
            <span className="min-w-0 flex-1 truncate">
              {t(STATUS_KEYS[status])}
            </span>
            {active && <Check className="size-4 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
