"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, ClipboardList } from "lucide-react";
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
  handle,
}: {
  job: JobItem;
  isOverlay?: boolean;
  /** Drag-handle node, absolutely positioned along the card's right edge. */
  handle?: ReactNode;
}) {
  const t = useTranslations("jobs");

  return (
    <Card
      className={cn(
        "relative border bg-card py-0 transition-shadow",
        isOverlay && "rotate-2 shadow-xl ring-2 ring-primary/40"
      )}
    >
      <CardContent className={cn("space-y-1.5 p-3", handle && "pr-12")}>
        <p className="text-sm font-medium leading-snug text-card-foreground line-clamp-2">
          {job.title}
        </p>

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
          {job.hasBrief && (
            <Link
              href={`/jobs/${job.id}#brief`}
              title={t("brief")}
              aria-label={t("brief")}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={(e) => e.stopPropagation()}
            >
              <ClipboardList className="h-3 w-3" />
              {t("brief")}
            </Link>
          )}
        </div>

        {job.publishDate && (
          <p className="text-[11px] text-muted-foreground">
            {t("publishDate")}: {formatDateThai(job.publishDate)}
          </p>
        )}
      </CardContent>
      {handle}
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
  const t = useTranslations("jobs");
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
    data: { job, status: job.status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative rounded-xl transition-opacity",
        isDragging && "opacity-40"
      )}
    >
      {/* Tap layer: opens the job. Stays native so the column can scroll. */}
      <div
        role="button"
        tabIndex={0}
        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onOpen(job)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(job);
          }
        }}
      >
        <BoardCardContent
          job={job}
          handle={
            // Finger-sized (44px) drag handle. `touch-none` lets it start a
            // drag immediately on iOS without the browser hijacking the touch
            // for scrolling/selection, while the rest of the card scrolls/taps.
            <span
              {...attributes}
              {...listeners}
              role="button"
              tabIndex={0}
              aria-label={t("dragHandle")}
              aria-roledescription="draggable"
              className="absolute inset-y-1 right-1 flex w-10 cursor-grab touch-none select-none items-center justify-center rounded-lg text-muted-foreground/40 outline-none [-webkit-touch-callout:none] hover:bg-muted hover:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="size-5" />
            </span>
          }
        />
      </div>
    </div>
  );
}
