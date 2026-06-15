"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  REVIEW_JOB_STATUSES,
  type ReviewJobStatus,
} from "@/lib/schemas/reviewJob";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseAsInteger, useQueryState } from "nuqs";
import { PageHeader } from "@/components/ui/page-header";
import { BoardColumn } from "@/components/board/BoardColumn";
import { BoardCardContent } from "@/components/board/BoardCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { StatusChipBar } from "@/components/board/StatusChipBar";
import { JobSheet } from "@/components/board/JobSheet";
import { PaidConfirmSheet } from "@/components/board/PaidConfirmSheet";
import { STATUS_KEYS } from "@/components/board/statusTheme";
import type { JobItem, JobsByStatus } from "@/components/board/types";

const COLLAPSED_STORAGE_KEY = "board-collapsed-columns";
const DND_HINT_STORAGE_KEY = "board-dnd-hint-dismissed";

const BOARD_HEIGHT_CLASS =
  "h-[calc(100dvh-285px)] min-h-[300px] lg:h-[calc(100dvh-185px)]";

function vibrate(ms: number) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      // not supported
    }
  }
}

function BoardSkeleton() {
  return (
    <div className={cn("flex gap-3 overflow-hidden", BOARD_HEIGHT_CLASS)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex h-full w-[80vw] max-w-[320px] shrink-0 flex-col rounded-lg border bg-muted/30 p-3 md:w-[300px] lg:w-[280px]"
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
  );
}

function groupJobsByStatus(jobs: JobItem[]): JobsByStatus {
  const grouped: JobsByStatus = {};
  for (const status of REVIEW_JOB_STATUSES) {
    grouped[status] = [];
  }
  for (const job of jobs) {
    const status = REVIEW_JOB_STATUSES.includes(job.status as ReviewJobStatus)
      ? job.status
      : "received";
    grouped[status].push(job);
  }
  return grouped;
}

export function JobsDndClient() {
  const t = useTranslations("jobs");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthsQuery, setMonthsQuery] = useQueryState(
    "months",
    parseAsInteger.withDefault(3)
  );

  // Drag state
  const [activeJob, setActiveJob] = useState<JobItem | null>(null);
  const lastDragEndAt = useRef(0);

  // Card detail sheet
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [jobSheetOpen, setJobSheetOpen] = useState(false);
  const [moving, setMoving] = useState(false);

  // Paid confirmation
  const [paidDialogOpen, setPaidDialogOpen] = useState(false);
  const [paidDialogSaving, setPaidDialogSaving] = useState(false);
  const [pendingPaidJob, setPendingPaidJob] = useState<JobItem | null>(null);
  const [paidPaymentDate, setPaidPaymentDate] = useState<string>("");
  const [paidEvidenceFiles, setPaidEvidenceFiles] = useState<File[]>([]);
  const pendingPrevStatusRef = useRef<string | null>(null);
  const pendingPrevPaymentDateRef = useRef<string | null>(null);

  // Mobile column pager
  const scrollRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRafRef = useRef<number | null>(null);
  const [activeColIndex, setActiveColIndex] = useState(0);

  // Collapsible columns (desktop/iPad)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // One-time onboarding hint for the drag-to-status gesture (mobile).
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DND_HINT_STORAGE_KEY)) setShowHint(true);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      localStorage.setItem(DND_HINT_STORAGE_KEY, "1");
    } catch {
      // ignore quota errors
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (raw) setCollapsed(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const toggleCollapse = useCallback((status: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  const pendingMinPaymentDate = useMemo(() => {
    const job = pendingPaidJob;
    if (!job) return undefined;
    const received = (job.receivedDate ?? "").trim() || null;
    const review = (job.reviewDeadline ?? "").trim() || null;
    const publish = (job.publishDate ?? "").trim() || null;
    return publish || review || received || undefined;
  }, [pendingPaidJob]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      // Short delay: the card's drag handle is `touch-none`, so there's no
      // scroll/drag ambiguity to wait out — keep it responsive on mobile.
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchJobs = useCallback(
    async (months: number) => {
      try {
        const search =
          Number.isFinite(months) && months > 0 ? `?months=${months}` : "";
        const res = await fetch(`/api/jobs/board${search}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("loadingError"));
        const data = (json.data ?? []) as Array<
          JobItem & { brief?: string | null; briefLink?: string | null }
        >;
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
            hasBrief: Boolean(j.brief?.trim() || j.briefLink?.trim()),
          }))
        );
      } catch (e) {
        toast.error(t("loadingError"), String(e));
        setJobs([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    setLoading(true);
    fetchJobs(monthsQuery ?? 3);
  }, [fetchJobs, monthsQuery]);

  const resetPaidDialogState = useCallback(() => {
    setPaidDialogSaving(false);
    setPendingPaidJob(null);
    setPaidPaymentDate("");
    setPaidEvidenceFiles([]);
    pendingPrevStatusRef.current = null;
    pendingPrevPaymentDateRef.current = null;
  }, []);

  const startPaidFlow = useCallback((job: JobItem, fromStatus: string) => {
    pendingPrevStatusRef.current = fromStatus;
    pendingPrevPaymentDateRef.current = job.paymentDate ?? null;
    setPendingPaidJob(job);
    const min = (job.publishDate ?? job.reviewDeadline ?? job.receivedDate ?? "")
      .toString()
      .trim();
    const todayIso = new Date().toISOString().slice(0, 10);
    const defaultDate =
      job.paymentDate?.trim() ||
      (min && todayIso < min ? min : todayIso) ||
      todayIso;
    setPaidPaymentDate(defaultDate);
    setPaidEvidenceFiles([]);
    setPaidDialogOpen(true);
  }, []);

  /** Shared by drag-and-drop and the tap-to-move status picker. */
  const moveJob = useCallback(
    async (job: JobItem, newStatus: string) => {
      if (!REVIEW_JOB_STATUSES.includes(newStatus as ReviewJobStatus)) return;
      if (job.status === newStatus) return;

      if (newStatus === "paid") {
        startPaidFlow(job, job.status);
        return;
      }

      const prevJobs = [...jobs];
      setMoving(true);
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
      } finally {
        setMoving(false);
      }
    },
    [jobs, startPaidFlow, t]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const job = event.active.data?.current?.job as JobItem | undefined;
    setActiveJob(job ?? null);
    vibrate(10);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      lastDragEndAt.current = Date.now();
      setActiveJob(null);
      const { active, over } = event;
      if (!over) return;
      vibrate(8);

      const job = active.data?.current?.job as JobItem | undefined;
      if (!job) return;
      // Drop target can be a column or a top status chip — both carry the
      // target status in `data.status` (chips use a `chip-` prefixed id).
      const targetStatus =
        (over.data?.current?.status as string | undefined) ?? String(over.id);
      void moveJob(job, targetStatus);
    },
    [moveJob]
  );

  const handleDragCancel = useCallback(() => {
    lastDragEndAt.current = Date.now();
    setActiveJob(null);
  }, []);

  const openJob = useCallback((job: JobItem) => {
    // Ignore the synthetic click that follows a completed drag.
    if (Date.now() - lastDragEndAt.current < 300) return;
    setSelectedJob(job);
    setJobSheetOpen(true);
  }, []);

  const handleSheetMove = useCallback(
    (job: JobItem, status: string) => {
      setJobSheetOpen(false);
      void moveJob(job, status);
    },
    [moveJob]
  );

  const handlePaidDialogCancel = useCallback(() => {
    if (paidDialogSaving) return;
    setPaidDialogOpen(false);
    resetPaidDialogState();
  }, [paidDialogSaving, resetPaidDialogState]);

  const handlePaidDialogSave = useCallback(async () => {
    const job = pendingPaidJob;
    if (!job) return;
    const paymentDate = paidPaymentDate.trim();
    if (!paymentDate) {
      toast.error(t("updateError"), t("paidDialogPaymentDateRequired"));
      return;
    }

    setPaidDialogSaving(true);

    const prevStatus = pendingPrevStatusRef.current ?? job.status ?? "received";
    const prevPaymentDate =
      pendingPrevPaymentDateRef.current ?? job.paymentDate ?? null;

    try {
      const patchRes = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paymentDate }),
      });
      const patchJson = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchJson.error ?? t("updateError"));

      if (paidEvidenceFiles.length > 0) {
        for (const file of paidEvidenceFiles) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) throw new Error(t("uploadError"));
          const uploadJson = await uploadRes.json();
          const docRes = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reviewJobId: job.id,
              kind: "evidence",
              filePath: uploadJson.filePath,
            }),
          });
          if (!docRes.ok) throw new Error(t("uploadError"));
        }
      }

      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, status: "paid", paymentDate } : j
        )
      );
      toast.success(t("updateSuccess"));
      setPaidDialogOpen(false);
      resetPaidDialogState();
    } catch (e) {
      toast.error(t("updateError"), String(e));
      try {
        await fetch(`/api/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: prevStatus,
            paymentDate: prevPaymentDate,
          }),
        });
      } catch {
        // best-effort revert
      }
      setPaidDialogOpen(false);
      resetPaidDialogState();
    } finally {
      setPaidDialogSaving(false);
    }
  }, [
    paidEvidenceFiles,
    paidPaymentDate,
    pendingPaidJob,
    resetPaidDialogState,
    t,
  ]);

  const grouped = groupJobsByStatus(jobs);

  const statusLabel = useCallback(
    (status: string) => t(STATUS_KEYS[status] ?? "statusReceived"),
    [t]
  );

  const chipItems = useMemo(
    () =>
      REVIEW_JOB_STATUSES.map((status) => ({
        status,
        label: statusLabel(status),
        count: grouped[status]?.length ?? 0,
      })),
    [grouped, statusLabel]
  );

  const scrollToColumn = useCallback((index: number) => {
    const container = scrollRef.current;
    const el = colRefs.current[index];
    if (!container || !el) return;
    // Center the column so the previous/next status columns peek on each side.
    const left = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    setActiveColIndex(index);
  }, []);

  const handleBoardScroll = useCallback(() => {
    if (scrollRafRef.current != null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = scrollRef.current;
      if (!container) return;
      // The column whose center is nearest the viewport center is "active".
      const viewportCenter = container.scrollLeft + container.clientWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      colRefs.current.forEach((el, i) => {
        if (!el) return;
        const colCenter = el.offsetLeft + el.offsetWidth / 2;
        const d = Math.abs(colCenter - viewportCenter);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActiveColIndex(best);
    });
  }, []);

  const announcements = useMemo(
    () => ({
      onDragStart({ active }: { active: { data: { current?: unknown } } }) {
        const job = (active.data.current as { job?: JobItem } | undefined)?.job;
        return t("dragPickedUp", { title: job?.title ?? "" });
      },
      onDragOver({ over }: { over: { id: string | number } | null }) {
        if (!over) return;
        return t("dragOverColumn", { column: statusLabel(String(over.id)) });
      },
      onDragEnd({
        active,
        over,
      }: {
        active: { data: { current?: unknown } };
        over: { id: string | number } | null;
      }) {
        const job = (active.data.current as { job?: JobItem } | undefined)?.job;
        if (!over) return t("dragCanceled");
        return t("dragDropped", {
          title: job?.title ?? "",
          column: statusLabel(String(over.id)),
        });
      },
      onDragCancel() {
        return t("dragCanceled");
      },
    }),
    [statusLabel, t]
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <PageHeader
        className="shrink-0"
        title={t("boardTitle")}
        actions={
          <>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {t("monthsRange")}
          </span>
          <Select
            value={String(monthsQuery ?? 3)}
            onValueChange={(value) => {
              const next = Number(value);
              if (!Number.isFinite(next) || next <= 0) {
                void setMonthsQuery(3);
              } else {
                void setMonthsQuery(next);
              }
            }}
          >
            <SelectTrigger size="sm" className="min-h-[40px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 3, 6, 12].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {t("monthsOption", { count: m })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </>
        }
      />

      {loading ? (
        <BoardSkeleton />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          collisionDetection={pointerWithin}
          accessibility={{
            announcements,
            screenReaderInstructions: { draggable: t("dragInstructions") },
          }}
        >
          <StatusChipBar
            className="shrink-0 lg:hidden"
            items={chipItems}
            activeIndex={activeColIndex}
            onSelect={scrollToColumn}
            dragging={activeJob != null}
          />

          {showHint && !activeJob && (
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-xs text-muted-foreground lg:hidden">
              <ArrowUp className="size-4 shrink-0 animate-bounce text-primary" />
              <GripVertical className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 leading-snug">{t("dndHint")}</span>
              <button
                type="button"
                onClick={dismissHint}
                className="shrink-0 rounded-md px-2 py-1 font-medium text-primary hover:bg-primary/10"
              >
                {t("dndHintDismiss")}
              </button>
            </div>
          )}

          <div
            ref={scrollRef}
            onScroll={handleBoardScroll}
            className={cn(
              "relative flex w-full min-w-0 gap-3 overflow-x-auto overscroll-x-contain pb-2",
              BOARD_HEIGHT_CLASS,
              activeJob ? "snap-none" : "snap-x snap-mandatory lg:snap-none"
            )}
          >
            {REVIEW_JOB_STATUSES.map((status, index) => (
              <div
                key={status}
                ref={(el) => {
                  colRefs.current[index] = el;
                }}
                className={cn(
                  "h-full min-h-0 shrink-0 snap-center",
                  collapsed.has(status)
                    ? "w-auto"
                    : "w-[80vw] max-w-[320px] md:w-[300px] lg:w-[280px]"
                )}
              >
                <BoardColumn
                  status={status}
                  label={statusLabel(status)}
                  jobs={grouped[status] ?? []}
                  collapsed={collapsed.has(status)}
                  onToggleCollapse={toggleCollapse}
                  onOpenJob={openJob}
                />
              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
            {activeJob ? <BoardCardContent job={activeJob} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <JobSheet
        job={selectedJob}
        open={jobSheetOpen}
        onOpenChange={setJobSheetOpen}
        onMove={handleSheetMove}
        busy={moving}
      />

      <PaidConfirmSheet
        open={paidDialogOpen}
        saving={paidDialogSaving}
        paymentDate={paidPaymentDate}
        minPaymentDate={pendingMinPaymentDate}
        files={paidEvidenceFiles}
        onPaymentDateChange={setPaidPaymentDate}
        onFilesChange={setPaidEvidenceFiles}
        onCancel={handlePaidDialogCancel}
        onSave={handlePaidDialogSave}
      />
    </div>
  );
}
