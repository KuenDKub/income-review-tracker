"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { statusTheme, STATUS_KEYS } from "@/components/board/statusTheme";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

/**
 * Status pill used in list/table views. Soft tinted surface + a solid status
 * dot so the state reads without relying on color alone — matches the board's
 * chip convention (see board/statusTheme.ts).
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations("jobs");
  const theme = statusTheme(status);
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        theme.column,
        className
      )}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", theme.dot)} />
      {t(STATUS_KEYS[status] ?? "statusReceived")}
    </span>
  );
}
