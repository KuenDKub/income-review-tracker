"use client";

import { useTranslations } from "next-intl";
import { useDroppable } from "@dnd-kit/core";
import { ChevronsLeftRight, ChevronsRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusTheme } from "./statusTheme";
import { BoardCard } from "./BoardCard";
import type { JobItem } from "./types";

type BoardColumnProps = {
  status: string;
  label: string;
  jobs: JobItem[];
  collapsed: boolean;
  onToggleCollapse: (status: string) => void;
  onOpenJob: (job: JobItem) => void;
};

export function BoardColumn({
  status,
  label,
  jobs,
  collapsed,
  onToggleCollapse,
  onOpenJob,
}: BoardColumnProps) {
  const t = useTranslations("jobs");
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });
  const theme = statusTheme(status);

  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "hidden h-full w-12 shrink-0 flex-col items-center gap-2 rounded-lg border p-2 transition-colors lg:flex",
          theme.column,
          isOver && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <button
          type="button"
          aria-label={t("expandColumn")}
          className="flex size-8 cursor-pointer touch-manipulation items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          onClick={() => onToggleCollapse(status)}
        >
          <ChevronsLeftRight className="size-4" />
        </button>
        <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums dark:bg-white/15">
          {jobs.length}
        </span>
        <span
          className="mt-1 text-xs font-medium [writing-mode:vertical-rl]"
          aria-hidden
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-0 w-full flex-col rounded-lg border p-2.5 transition-colors",
        theme.column,
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden
            className={cn("size-2 shrink-0 rounded-full", theme.dot)}
          />
          <span className="truncate">{label}</span>
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold tabular-nums dark:bg-white/15">
            {jobs.length}
          </span>
          <button
            type="button"
            aria-label={t("collapseColumn")}
            className="hidden size-7 cursor-pointer touch-manipulation items-center justify-center rounded-md hover:bg-black/5 lg:flex dark:hover:bg-white/10"
            onClick={() => onToggleCollapse(status)}
          >
            <ChevronsRightLeft className="size-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain rounded-md pb-1">
        {jobs.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-current/25 text-sm opacity-70">
            {t("emptyColumn")}
          </div>
        ) : (
          jobs.map((job) => (
            <BoardCard key={job.id} job={job} onOpen={onOpenJob} />
          ))
        )}
      </div>
    </div>
  );
}
