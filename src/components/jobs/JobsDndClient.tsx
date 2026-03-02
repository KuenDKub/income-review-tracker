"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformBadges } from "./PlatformBadges";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, GripVertical } from "lucide-react";
import { formatDateThai } from "@/lib/formatDate";
import {
  REVIEW_JOB_STATUSES,
  type ReviewJobStatus,
} from "@/lib/schemas/reviewJob";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
  STATUS_BADGE_CLASS,
  DEFAULT_STATUS_BADGE_CLASS,
} from "./statusBadge";

/** Softer column colors for DnD board (lighter than badge) */
const STATUS_COLUMN_CLASS: Record<string, string> = {
  received:
    "bg-zinc-50 text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600",
  script_sent:
    "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200 border-orange-200 dark:border-orange-800",
  in_progress:
    "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200 border-sky-200 dark:border-sky-700",
  waiting_edit:
    "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border-rose-200 dark:border-rose-700",
  waiting_review:
    "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200 border-violet-200 dark:border-violet-700",
  approved_pending:
    "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200 border-teal-200 dark:border-teal-700",
  paid: "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200 border-green-200 dark:border-green-700",
};

const STATUS_KEYS: Record<string, string> = {
  received: "statusReceived",
  script_sent: "statusScriptSent",
  in_progress: "statusInProgress",
  waiting_edit: "statusWaitingEdit",
  waiting_review: "statusWaitingReview",
  approved_pending: "statusApprovedPending",
  paid: "statusPaid",
};

type JobItem = {
  id: string;
  title: string;
  platforms: string[];
  contentType: string;
  payerName?: string | null;
  status: string;
  receivedDate?: string | null;
  reviewDeadline?: string | null;
  publishDate?: string | null;
  paymentDate?: string | null;
  grossAmount?: number | null;
  netAmount?: number | null;
};

type JobsByStatus = Record<string, JobItem[]>;

function JobCard({
  job,
  isDragging,
}: {
  job: JobItem;
  isDragging?: boolean;
}) {
  const t = useTranslations("jobs");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndIsDragging,
  } = useDraggable({
    id: job.id,
    data: { job, status: job.status },
  });

  const dragging = isDragging ?? dndIsDragging;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-2 cursor-grab active:cursor-grabbing transition-shadow",
        dragging && "opacity-50 shadow-lg"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div
            className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Link
              href={`/jobs/${job.id}`}
              className="font-medium text-primary hover:underline line-clamp-1"
              onClick={(e) => e.stopPropagation()}
            >
              {job.title}
            </Link>
            {job.payerName && (
              <p className="text-xs text-muted-foreground">{job.payerName}</p>
            )}
            <PlatformBadges platforms={job.platforms ?? []} className="gap-1" />
            <p className="text-xs">{job.contentType || "—"}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs text-muted-foreground">
              {job.reviewDeadline && (
                <span>
                  {t("reviewDeadline")}: {formatDateThai(job.reviewDeadline)}
                </span>
              )}
              {job.publishDate && (
                <span>
                  {t("publishDate")}: {formatDateThai(job.publishDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Column({
  status,
  jobs,
  label,
}: {
  status: string;
  jobs: JobItem[];
  label: string;
}) {
  const t = useTranslations("jobs");
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const statusClass =
    STATUS_COLUMN_CLASS[status] ?? DEFAULT_STATUS_BADGE_CLASS;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border p-3 transition-colors",
        statusClass,
        "w-full min-w-0 lg:h-full lg:w-auto lg:min-w-[240px] lg:max-w-[280px] lg:shrink-0",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h3 className="font-medium">{label}</h3>
        <span className="text-sm opacity-90">{jobs.length}</span>
      </div>
      <div className="min-h-0 flex-1 space-y-0 overflow-y-auto">
        {jobs.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("emptyColumn")}
          </p>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <div className="flex flex-col gap-4 pb-4 lg:flex-row lg:inline-flex">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex w-full min-w-0 flex-col rounded-lg border bg-muted/30 p-3 lg:w-auto lg:min-w-[240px] lg:max-w-[280px] lg:shrink-0"
          >
            <Skeleton className="mb-3 h-5 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupJobsByStatus(jobs: JobItem[]): JobsByStatus {
  const grouped: JobsByStatus = {};
  for (const status of REVIEW_JOB_STATUSES) {
    grouped[status] = [];
  }
  for (const job of jobs) {
    const status =
      REVIEW_JOB_STATUSES.includes(job.status as ReviewJobStatus)
        ? job.status
        : "received";
    grouped[status].push(job);
  }
  return grouped;
}

export function JobsDndClient() {
  const t = useTranslations("jobs");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs/board");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("loadingError"));
      const data = (json.data ?? []) as JobItem[];
      setJobs(
        data.map((j) => ({
          id: j.id,
          title: j.title,
          platforms: j.platforms || [],
          contentType: j.contentType,
          payerName: j.payerName ?? null,
          status: j.status,
          receivedDate: j.receivedDate ?? null,
          reviewDeadline: j.reviewDeadline ?? null,
          publishDate: j.publishDate ?? null,
          paymentDate: j.paymentDate ?? null,
          grossAmount: j.grossAmount ?? null,
          netAmount: j.netAmount ?? null,
        }))
      );
    } catch (e) {
      toast.error(t("loadingError"), String(e));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const job = active.data?.current?.job as JobItem | undefined;
      const currentStatus = active.data?.current?.status as string | undefined;
      const newStatus = String(over.id);

      if (!job || !REVIEW_JOB_STATUSES.includes(newStatus as ReviewJobStatus)) {
        return;
      }
      if (currentStatus === newStatus) return;

      const prevJobs = [...jobs];
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j))
      );

      try {
        const res = await fetch(`/api/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("updateError"));
        toast.success(t("updateSuccess"));
      } catch (e) {
        toast.error(t("updateError"), String(e));
        setJobs(prevJobs);
      }
    },
    [jobs, t]
  );

  const grouped = groupJobsByStatus(jobs);

  return (
    <div className="min-w-0 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href="/jobs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToJobs")}
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">{t("boardTitle")}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/jobs">{t("title")}</Link>
        </Button>
      </div>

      {loading ? (
        <BoardSkeleton />
      ) : (
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          collisionDetection={pointerWithin}
        >
          <div className="w-full min-w-0 overflow-x-auto pb-4 lg:h-[calc(100vh-11rem)] lg:overflow-y-hidden">
            <div className="flex flex-col gap-4 lg:flex-row lg:inline-flex lg:h-full lg:pb-4">
              {REVIEW_JOB_STATUSES.map((status) => (
                <Column
                  key={status}
                  status={status}
                  jobs={grouped[status] ?? []}
                  label={t(STATUS_KEYS[status] ?? "statusReceived")}
                />
              ))}
            </div>
          </div>
        </DndContext>
      )}
    </div>
  );
}
