"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileUpload } from "@/components/ui/file-upload";
import { PlatformBadges } from "./PlatformBadges";
import {
  STATUS_BADGE_CLASS,
  DEFAULT_STATUS_BADGE_CLASS,
} from "./statusBadgeClasses";
import { AddToCalendarButton } from "./AddToCalendarButton";
import { JobInvoices } from "./JobInvoices";
import { StatusPicker } from "@/components/board/StatusPicker";
import { REVIEW_JOB_STATUSES } from "@/lib/schemas/reviewJob";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useConfirm } from "@/components/ui/useConfirm";
import { BlurFade } from "@/components/ui/blur-fade";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useJobStatusMove } from "@/hooks/useJobStatusMove";
import {
  DetailsCard,
  BriefCard,
  IncomeCard,
  DatesCard,
  NotesCard,
  type JobDetail,
  type JobIncome,
  type BriefDoc,
} from "./sections/JobSections";
import type { z } from "zod";
import type { reviewJobSchema, ReviewJobStatus } from "@/lib/schemas/reviewJob";

const STATUS_KEYS: Record<string, string> = {
  received: "statusReceived",
  script_sent: "statusScriptSent",
  in_progress: "statusInProgress",
  waiting_edit: "statusWaitingEdit",
  waiting_review: "statusWaitingReview",
  approved_waiting_to_publish: "statusApprovedWaitingToPublish",
  approved_pending: "statusApprovedPending",
  paid: "statusPaid",
};

type JobFormValues = z.infer<typeof reviewJobSchema>;

export function JobDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const { confirm, confirmDialog } = useConfirm();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [payerNames, setPayerNames] = useState<string[]>([]);
  const [documents, setDocuments] = useState<BriefDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [jobIncome, setJobIncome] = useState<JobIncome | null>(null);

  // Header quick-edit state
  const [statusOpen, setStatusOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jobRes, docsRes, incomeRes] = await Promise.all([
        fetch(`/api/jobs/${id}`),
        fetch(`/api/documents?reviewJobId=${id}`),
        fetch(`/api/income?reviewJobId=${id}&pageSize=1`),
      ]);
      const jobJson = await jobRes.json();
      const docsJson = await docsRes.json();
      const incomeJson = await incomeRes.json();
      if (!jobRes.ok) throw new Error(jobJson.error ?? t("jobNotFound"));
      setJob(jobJson.data ?? null);
      const docs = (docsJson.data ?? []) as BriefDoc[];
      setDocuments(docs);
      const incomeList = (incomeJson?.data ?? []) as JobIncome[];
      setJobIncome(
        incomeList[0] &&
          (incomeList[0].grossAmount > 0 || incomeList[0].netAmount > 0)
          ? incomeList[0]
          : null,
      );
    } catch (e) {
      toast.error(t("loadingError"), String(e));
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Payer suggestions are needed by both the inline Details editor and the
  // full "Edit all" form, so fetch them once the page has a job.
  useEffect(() => {
    fetch("/api/jobs/payer-names")
      .then((r) => r.json())
      .then((json: { data?: string[] }) => setPayerNames(json.data ?? []))
      .catch(() => setPayerNames([]));
  }, []);

  const { moveJob, paidSheet, busy: moveBusy } = useJobStatusMove({
    onApply: (_jobId, patch) =>
      setJob((prev) =>
        prev
          ? {
              ...prev,
              status: patch.status,
              ...(patch.paymentDate !== undefined
                ? { paymentDate: patch.paymentDate }
                : {}),
            }
          : prev,
      ),
    onRevert: (_jobId, prev) =>
      setJob((cur) =>
        cur
          ? { ...cur, status: prev.status, paymentDate: prev.paymentDate }
          : cur,
      ),
    onSaved: () => load(),
  });

  /** PATCH a single section and refresh. Throws so the editor can stay open. */
  const saveSection = useCallback(
    async (patch: Partial<JobFormValues>) => {
      try {
        const res = await fetch(`/api/jobs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("updateError"));
        toast.success(t("updateSuccess"));
        await load();
      } catch (e) {
        toast.error(t("updateError"), String(e));
        throw e;
      }
    },
    [id, t, load],
  );

  /** Upload newly picked evidence images immediately, then refresh. */
  const uploadEvidence = async (files: File[]) => {
    if (files.length === 0 || uploadingEvidence) return;
    setUploadingEvidence(true);
    try {
      for (const file of files) {
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
            reviewJobId: id,
            kind: "evidence",
            filePath: uploadJson.filePath,
          }),
        });
        if (!docRes.ok) throw new Error(t("uploadError"));
      }
      toast.success(t("updateSuccess"));
      await load();
    } catch (e) {
      toast.error(t("uploadError"), String(e));
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? t("deleteError"));
      }
      toast.success(t("deleteSuccess"));
      router.push("/jobs");
    } catch (e) {
      toast.error(t("deleteError"), String(e));
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (deletingDocId) return;
    if (!(await confirm({ description: t("confirmDeleteDocument") }))) return;
    setDeletingDocId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("deleteDocError"));
      toast.success(t("deleteDocSuccess"));
      await load();
    } catch (e) {
      toast.error(t("deleteDocError"), String(e));
    } finally {
      setDeletingDocId(null);
    }
  };

  const saveTitle = async () => {
    const next = titleDraft.trim();
    if (!next || !job || next === job.title) {
      setTitleEditing(false);
      return;
    }
    setTitleSaving(true);
    try {
      await saveSection({ title: next });
      setTitleEditing(false);
    } catch {
      // error toast already shown by saveSection
    } finally {
      setTitleSaving(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-28" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-full max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    );
  if (!job)
    return <p className="text-sm text-muted-foreground">{t("jobNotFound")}</p>;

  const status: ReviewJobStatus = REVIEW_JOB_STATUSES.includes(
    job.status as ReviewJobStatus,
  )
    ? (job.status as ReviewJobStatus)
    : "received";

  const incomeDefaults = job.isBrotherJob
    ? { isBrotherJob: true as const }
    : jobIncome
      ? jobIncome.withholdingAmount > 0
        ? {
            hasWithholdingTax: true as const,
            amount: jobIncome.grossAmount,
            withholdingRate:
              jobIncome.grossAmount > 0
                ? (jobIncome.withholdingAmount / jobIncome.grossAmount) * 100
                : 3,
          }
        : {
            hasWithholdingTax: false as const,
            amount: jobIncome.grossAmount,
          }
      : { hasWithholdingTax: false as const };

  const defaultValues = {
    payerName: job.payerName ?? "",
    status,
    platforms: job.platforms || [],
    contentType: job.contentType,
    title: job.title,
    receivedDate: job.receivedDate ?? "",
    reviewDeadline: job.reviewDeadline ?? "",
    publishDate: job.publishDate ?? "",
    paymentDate: job.paymentDate ?? "",
    tags: job.tags,
    notes: job.notes,
    brief: job.brief ?? "",
    briefLink: job.briefLink ?? "",
    briefLinkNote: job.briefLinkNote ?? "",
    showOnPortfolio: job.showOnPortfolio ?? true,
    ...incomeDefaults,
  } as unknown as JobFormValues;

  const briefDocs = documents.filter((doc) => doc.kind === "brief");
  const evidenceDocs = documents.filter((doc) => doc.kind === "evidence");
  const showEvidence = job.status === "paid";

  const sectionProps = {
    job,
    defaultValues,
    confirm,
    onSave: saveSection,
  };

  const calendarJob = {
    title: job.title,
    platforms: job.platforms,
    contentType: job.contentType,
    payerName: job.payerName,
    notes: job.notes,
    reviewDeadline: job.reviewDeadline ?? null,
    publishDate: job.publishDate ?? null,
  };

  return (
    <div className="space-y-5 pb-24 md:space-y-6 md:pb-0">
      <BlurFade className="space-y-4 rounded-xl border bg-card p-4 shadow-sm md:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 min-h-11 justify-start text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4" />
            {t("backToJobs")}
          </Link>
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("changeStatus")}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "cursor-pointer border text-xs",
                        STATUS_BADGE_CLASS[job.status] ??
                          DEFAULT_STATUS_BADGE_CLASS,
                      )}
                    >
                      {t(STATUS_KEYS[job.status] ?? "statusReceived")}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-2">
                  <StatusPicker
                    current={job.status}
                    disabled={moveBusy}
                    onSelect={(next) => {
                      setStatusOpen(false);
                      void moveJob(
                        {
                          id: job.id,
                          status: job.status,
                          paymentDate: job.paymentDate ?? null,
                          receivedDate: job.receivedDate ?? null,
                          reviewDeadline: job.reviewDeadline ?? null,
                          publishDate: job.publishDate ?? null,
                        },
                        next,
                      );
                    }}
                  />
                </PopoverContent>
              </Popover>
              {job.isBrotherJob && (
                <Badge
                  variant="outline"
                  className="border-purple-200 bg-purple-100 text-xs text-purple-800 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
                >
                  {t("brotherBadge")}
                </Badge>
              )}
            </div>

            {titleEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveTitle();
                    } else if (e.key === "Escape") {
                      setTitleEditing(false);
                    }
                  }}
                  className="h-auto max-w-xl py-1 text-2xl font-semibold md:text-3xl"
                  disabled={titleSaving}
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  loading={titleSaving}
                  onClick={() => void saveTitle()}
                  aria-label={tCommon("save")}
                >
                  {titleSaving ? null : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  disabled={titleSaving}
                  onClick={() => setTitleEditing(false)}
                  aria-label={tCommon("cancel")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                  {job.title}
                </h1>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={t("editTitleAria")}
                  onClick={() => {
                    setTitleDraft(job.title);
                    setTitleEditing(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {job.payerName && <span>{job.payerName}</span>}
              <PlatformBadges platforms={job.platforms ?? []} />
              {job.contentType && <span>{job.contentType}</span>}
            </div>
          </div>

          <div className="hidden shrink-0 flex-wrap gap-2 md:flex md:justify-end">
            <AddToCalendarButton job={calendarJob} />
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              {tCommon("delete")}
            </Button>
          </div>
        </div>
      </BlurFade>

      <DetailsCard {...sectionProps} payerNames={payerNames} />

      <BriefCard
        {...sectionProps}
        briefDocs={briefDocs}
        onAttachmentsChanged={load}
      />

      <IncomeCard {...sectionProps} income={jobIncome} />

      {!job.isBrotherJob && <JobInvoices jobId={id} />}

      <DatesCard {...sectionProps} />

      <NotesCard {...sectionProps} />

      {showEvidence && (
        <Card className="gap-4 py-4 shadow-sm md:py-5">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-base">{t("evidenceImages")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5">
            <FileUpload
              value={[]}
              onChange={(files) => void uploadEvidence(files)}
              accept="image/*"
              multiple
              existingImages={evidenceDocs.map((doc) => ({
                id: doc.id,
                url: doc.filePath,
              }))}
              onRemoveExisting={(docId) => void handleDeleteDocument(docId)}
              className={
                uploadingEvidence ? "pointer-events-none opacity-70" : undefined
              }
            />
          </CardContent>
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t bg-background/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2">
          <AddToCalendarButton job={calendarJob} className="min-h-11 w-full" />
          <Button
            variant="destructive"
            size="icon"
            className="h-11 w-11"
            aria-label={tCommon("delete")}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
      />

      {paidSheet}
      {confirmDialog}
    </div>
  );
}
