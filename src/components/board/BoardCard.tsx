"use client";

import { useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/core";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformBadges } from "@/components/jobs/PlatformBadges";
import { DueChip } from "@/components/jobs/DueChip";
import { formatDateThai } from "@/lib/formatDate";
import { formatTHB } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { JobItem } from "./types";

export function BoardCardContent({
  job,
  isOverlay,
}: {
  job: JobItem;
  isOverlay?: boolean;
}) {
  const t = useTranslations("jobs");

  return (
    <Card
      className={cn(
        "border bg-card py-0 transition-shadow",
        isOverlay && "rotate-2 shadow-xl ring-2 ring-primary/40"
      )}
    >
      <CardContent className="space-y-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-card-foreground line-clamp-2">
            {job.title}
          </p>
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
        </div>

        {(job.payerName || job.netAmount != null) && (
          <p className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">{job.payerName ?? ""}</span>
            {job.netAmount != null && (
              <span className="shrink-0 font-medium tabular-nums text-foreground">
                {formatTHB(job.netAmount)} ฿
              </span>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <PlatformBadges platforms={job.platforms ?? []} className="gap-1" />
          <DueChip
            status={job.status}
            reviewDeadline={job.reviewDeadline}
            publishDate={job.publishDate}
          />
        </div>

        {job.publishDate && (
          <p className="text-[11px] text-muted-foreground">
            {t("publishDate")}: {formatDateThai(job.publishDate)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function BoardCard({
  job,
  onOpen,
}: {
  job: JobItem;
  onOpen: (job: JobItem) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
    data: { job, status: job.status },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-roledescription="draggable"
      className={cn(
        "cursor-grab touch-manipulation select-none rounded-xl outline-none transition-opacity [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      onClick={() => onOpen(job)}
      onKeyDown={(e) => {
        if (e.key === "o") onOpen(job);
      }}
    >
      <BoardCardContent job={job} />
    </div>
  );
}
