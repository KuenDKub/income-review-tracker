"use client";

import { useTranslations } from "next-intl";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

type DueChipProps = {
  status?: string;
  reviewDeadline?: string | null;
  publishDate?: string | null;
  className?: string;
};

/**
 * Deadline urgency chip: red when overdue, amber when due within 3 days,
 * muted otherwise. Hidden for paid jobs or jobs without dates.
 */
export function DueChip({
  status,
  reviewDeadline,
  publishDate,
  className,
}: DueChipProps) {
  const t = useTranslations("jobs");
  if (status === "paid") return null;
  const due = reviewDeadline?.trim() || publishDate?.trim();
  if (!due) return null;
  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return null;

  const days = differenceInCalendarDays(
    startOfDay(date),
    startOfDay(new Date())
  );

  let label: string;
  let toneClass: string;
  if (days < 0) {
    label = t("dueOverdue", { days: Math.abs(days) });
    toneClass = "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200";
  } else if (days === 0) {
    label = t("dueToday");
    toneClass =
      "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
  } else if (days <= 3) {
    label = t("dueInDays", { days });
    toneClass =
      "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
  } else {
    label = t("dueInDays", { days });
    toneClass = "bg-muted text-muted-foreground";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        toneClass,
        className
      )}
    >
      <CalendarClock className="size-3" />
      {label}
    </span>
  );
}
