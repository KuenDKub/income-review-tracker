"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformBadges } from "./PlatformBadges";
import {
  STATUS_BADGE_CLASS,
  DEFAULT_STATUS_BADGE_CLASS,
} from "./statusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobForm } from "./JobForm";
import { AddToCalendarButton } from "./AddToCalendarButton";
import {
  reviewJobCreateSchema,
  REVIEW_JOB_STATUSES,
} from "@/lib/schemas/reviewJob";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDateThai,
  isNearReviewDeadline,
  isPublishDatePassed,
} from "@/lib/formatDate";
import type { z } from "zod";
import type { ReviewJobStatus } from "@/lib/schemas/reviewJob";

const STATUS_KEYS: Record<string, string> = {
  received: "statusReceived",
  script_sent: "statusScriptSent",
  in_progress: "statusInProgress",
  waiting_edit: "statusWaitingEdit",
  waiting_review: "statusWaitingReview",
  approved_pending: "statusApprovedPending",
  paid: "statusPaid",
};

type ReviewJobJson = {
  id: string;
  payerName: string | null;
  status: string;
  platforms: string[];
  contentType: string;
  title: string;
  receivedDate?: string | null;
  reviewDeadline?: string | null;
  publishDate?: string | null;
  paymentDate?: string | null;
  tags: string[];
  notes: string | null;
  isBrotherJob?: boolean;
};

type DocumentJson = {
  id: string;
  filePath: string;
  kind: string;
  notes: string | null;
};

export function JobDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const [job, setJob] = useState<ReviewJobJson | null>(null);
  const [payerNames, setPayerNames] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [existingEvidenceImages, setExistingEvidenceImages] = useState<
    Array<{ id: string; url: string }>
  >([]);
  const [jobIncome, setJobIncome] = useState<{
    grossAmount: number;
    withholdingAmount: number;
    netAmount: number;
  } | null>(null);

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
      const docs = (docsJson.data ?? []) as DocumentJson[];
      setDocuments(docs);
      const incomeList = (incomeJson?.data ?? []) as Array<{
        grossAmount: number;
        withholdingAmount: number;
        netAmount: number;
      }>;
      setJobIncome(
        incomeList[0] &&
          (incomeList[0].grossAmount > 0 || incomeList[0].netAmount > 0)
          ? incomeList[0]
          : null,
      );
      setExistingEvidenceImages(
        docs
          .filter((doc) => doc.filePath)
          .map((doc) => ({ id: doc.id, url: doc.filePath! })),
      );
    } catch (e) {
      toast.error(t("loadingError"), String(e));
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (editOpen) {
      fetch("/api/jobs/payer-names")
        .then((r) => r.json())
        .then((json: { data?: string[] }) => setPayerNames(json.data ?? []))
        .catch(() => setPayerNames([]));
    }
  }, [editOpen]);

  const handleEditSubmit = async (
    data: z.infer<typeof reviewJobCreateSchema>,
  ) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("updateError"));

      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) {
            throw new Error(t("uploadError"));
          }
          const uploadJson = await uploadRes.json();
          await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reviewJobId: id,
              kind: "evidence",
              filePath: uploadJson.filePath,
            }),
          });
        }
        setEvidenceFiles([]);
      }

      toast.success(t("updateSuccess"));
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error(t("updateError"), String(e));
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
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    );
  if (!job)
    return <p className="text-sm text-muted-foreground">{t("jobNotFound")}</p>;

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("deleteDocError"));
      toast.success(t("deleteDocSuccess"));
      await load();
    } catch (e) {
      toast.error(t("deleteDocError"), String(e));
    }
  };

  const status: ReviewJobStatus = REVIEW_JOB_STATUSES.includes(
    job.status as ReviewJobStatus,
  )
    ? (job.status as ReviewJobStatus)
    : "received";

  const incomeDefaults =
    job.isBrotherJob
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
    ...incomeDefaults,
  };

  const showEvidence = job.status === "paid";
  const hasAnyDate =
    (job.receivedDate != null && job.receivedDate !== "") ||
    (job.reviewDeadline != null && job.reviewDeadline !== "") ||
    (job.publishDate != null && job.publishDate !== "") ||
    (job.paymentDate != null && job.paymentDate !== "");

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href="/jobs">
          <ArrowLeft className="h-4 w-4" />
          {t("backToJobs")}
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
        <div className="flex flex-wrap gap-2">
          <AddToCalendarButton
            job={{
              title: job.title,
              platforms: job.platforms,
              contentType: job.contentType,
              payerName: job.payerName,
              notes: job.notes,
              reviewDeadline: job.reviewDeadline ?? null,
              publishDate: job.publishDate ?? null,
            }}
          />
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            {tCommon("edit")}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            {tCommon("delete")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("overview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {job.payerName && (
              <div>
                <dt className="font-medium text-muted-foreground">
                  {t("payer")}
                </dt>
                <dd className="mt-1">{job.payerName}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-muted-foreground">
                {t("status")}
              </dt>
              <dd className="mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs border",
                    job.status
                      ? (STATUS_BADGE_CLASS[job.status] ??
                          DEFAULT_STATUS_BADGE_CLASS)
                      : DEFAULT_STATUS_BADGE_CLASS,
                  )}
                >
                  {job.status
                    ? t(STATUS_KEYS[job.status] ?? "statusReceived")
                    : "—"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                {t("table.platform")}
              </dt>
              <dd className="mt-1">
                <PlatformBadges platforms={job.platforms ?? []} />
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                {t("table.contentType")}
              </dt>
              <dd className="mt-1">{job.contentType || "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {hasAnyDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dates")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {job.receivedDate != null && job.receivedDate !== "" && (
                <div>
                  <dt className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {t("receivedDate")}
                  </dt>
                  <dd className="mt-1">{formatDateThai(job.receivedDate)}</dd>
                </div>
              )}
              {job.reviewDeadline != null && job.reviewDeadline !== "" && (
                <div>
                  <dt className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {t("reviewDeadline")}
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={
                        isNearReviewDeadline(job.reviewDeadline)
                          ? "rounded px-1 font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : undefined
                      }
                    >
                      {formatDateThai(job.reviewDeadline)}
                    </span>
                  </dd>
                </div>
              )}
              {job.publishDate != null && job.publishDate !== "" && (
                <div>
                  <dt className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {t("publishDate")}
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={
                        isPublishDatePassed(job.publishDate)
                          ? "rounded px-1 font-medium bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                          : undefined
                      }
                    >
                      {formatDateThai(job.publishDate)}
                    </span>
                  </dd>
                </div>
              )}
              {job.paymentDate != null && job.paymentDate !== "" && (
                <div>
                  <dt className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {t("paymentDate")}
                  </dt>
                  <dd className="mt-1">{formatDateThai(job.paymentDate)}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {job.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
          </CardContent>
        </Card>
      )}

      {showEvidence && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("evidenceImages")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="relative group rounded-lg border bg-muted/30 overflow-hidden"
                >
                  <img
                    src={doc.filePath}
                    alt="Evidence"
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editJob")}</DialogTitle>
          </DialogHeader>
          <JobForm
            schema={reviewJobCreateSchema}
            defaultValues={defaultValues}
            onSubmit={handleEditSubmit}
            submitLabel={tCommon("save")}
            payerNames={payerNames}
            evidenceFiles={evidenceFiles}
            onEvidenceFilesChange={setEvidenceFiles}
            existingEvidenceImages={existingEvidenceImages}
            onRemoveExistingEvidence={async (docId) => {
              try {
                const res = await fetch(`/api/documents/${docId}`, {
                  method: "DELETE",
                });
                if (!res.ok) throw new Error(t("deleteDocError"));
                setExistingEvidenceImages((prev) =>
                  prev.filter((img) => img.id !== docId),
                );
                await load();
                toast.success(t("removeImageSuccess"));
              } catch (e) {
                toast.error(t("removeImageError"), String(e));
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
