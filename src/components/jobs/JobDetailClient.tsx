"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlatformBadges } from "./PlatformBadges";
import {
  STATUS_BADGE_CLASS,
  DEFAULT_STATUS_BADGE_CLASS,
} from "./statusBadgeClasses";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { JobForm } from "./JobForm";
import { BriefAttachments } from "./BriefAttachments";
import { AddToCalendarButton } from "./AddToCalendarButton";
import { JobInvoices } from "./JobInvoices";
import {
  reviewJobCreateSchema,
  REVIEW_JOB_STATUSES,
} from "@/lib/schemas/reviewJob";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { briefLinkEmbed } from "@/lib/briefEmbed";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Trash2,
  ExternalLink,
  Copy,
  Pencil,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDateThai,
  isNearReviewDeadline,
  isPublishDatePassed,
} from "@/lib/formatDate";
import { formatTHB } from "@/lib/currency";
import type { z } from "zod";
import type { ReviewJobStatus } from "@/lib/schemas/reviewJob";

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

function DetailItem({
  label,
  children,
  icon,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-muted/20 p-3", className)}>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 min-h-5 text-sm font-medium">{children}</dd>
    </div>
  );
}

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
  brief?: string | null;
  briefLink?: string | null;
  briefLinkNote?: string | null;
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
  const tDashboard = useTranslations("dashboard");
  const [job, setJob] = useState<ReviewJobJson | null>(null);
  const [payerNames, setPayerNames] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
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
          .filter((doc) => doc.kind !== "brief" && doc.filePath)
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
    if (deletingDocId) return;
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
    brief: job.brief ?? "",
    briefLink: job.briefLink ?? "",
    briefLinkNote: job.briefLinkNote ?? "",
    ...incomeDefaults,
  };

  const briefEmbedUrl = job.briefLink ? briefLinkEmbed(job.briefLink) : null;
  const briefDocs = documents.filter((doc) => doc.kind === "brief");
  const evidenceDocs = documents.filter((doc) => doc.kind !== "brief");
  const hasBriefText = Boolean(job.brief && job.brief.trim());
  const hasBriefLink = Boolean(job.briefLink && job.briefLink.trim());
  const hasBriefContent = hasBriefText || hasBriefLink || briefDocs.length > 0;
  const showEvidence = job.status === "paid";
  const hasAnyDate =
    (job.receivedDate != null && job.receivedDate !== "") ||
    (job.reviewDeadline != null && job.reviewDeadline !== "") ||
    (job.publishDate != null && job.publishDate !== "") ||
    (job.paymentDate != null && job.paymentDate !== "");

  return (
    <div className="space-y-5 pb-24 md:space-y-6 md:pb-0">
      <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm md:p-6">
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
              <Badge
                variant="outline"
                className={cn(
                  "border text-xs",
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
              {job.isBrotherJob && (
                <Badge
                  variant="outline"
                  className="border-purple-200 bg-purple-100 text-xs text-purple-800 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
                >
                  {t("brotherBadge")}
                </Badge>
              )}
            </div>
            <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {job.payerName && <span>{job.payerName}</span>}
              <PlatformBadges platforms={job.platforms ?? []} />
              {job.contentType && <span>{job.contentType}</span>}
            </div>
          </div>

          <div className="hidden shrink-0 flex-wrap gap-2 md:flex md:justify-end">
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
              <Pencil className="h-4 w-4" />
              {tCommon("edit")}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              {tCommon("delete")}
            </Button>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label={t("payer")}>{job.payerName || "—"}</DetailItem>
          <DetailItem label={t("table.contentType")}>
            {job.contentType || "—"}
          </DetailItem>
          <DetailItem
            label={t("reviewDeadline")}
            icon={<Calendar className="h-3.5 w-3.5" />}
          >
            {job.reviewDeadline ? (
              <span
                className={
                  isNearReviewDeadline(job.reviewDeadline)
                    ? "rounded bg-amber-50 px-1 font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    : undefined
                }
              >
                {formatDateThai(job.reviewDeadline)}
              </span>
            ) : (
              "—"
            )}
          </DetailItem>
          <DetailItem
            label={t("publishDate")}
            icon={<Calendar className="h-3.5 w-3.5" />}
          >
            {job.publishDate ? (
              <span
                className={
                  isPublishDatePassed(job.publishDate)
                    ? "rounded bg-green-50 px-1 font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300"
                    : undefined
                }
              >
                {formatDateThai(job.publishDate)}
              </span>
            ) : (
              "—"
            )}
          </DetailItem>
        </dl>
      </div>

      <Card
        id="brief"
        className="scroll-mt-24 gap-4 border-primary/25 py-4 shadow-sm md:py-5"
      >
        <CardHeader className="gap-3 px-4 md:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              {t("brief")}
            </CardTitle>
            {(hasBriefLink || hasBriefText) && (
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {hasBriefLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    asChild
                  >
                    <a
                      href={job.briefLink!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("openBrief")}
                    </a>
                  </Button>
                )}
                {hasBriefText && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(job.brief ?? "");
                        toast.success(t("briefCopied"));
                      } catch {
                        toast.error(t("copyError"));
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    {t("copyBrief")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 md:px-5">
          {briefEmbedUrl && (
            <div className="relative w-full overflow-hidden rounded-lg border bg-muted/30 pt-[62%] sm:pt-[56.25%]">
              <iframe
                src={briefEmbedUrl}
                title={t("brief")}
                loading="lazy"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          )}
          {hasBriefLink && !briefEmbedUrl && (
            <a
              href={job.briefLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 break-all rounded-lg border bg-muted/30 px-4 py-3 text-sm font-medium text-primary"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              {job.briefLink}
            </a>
          )}
          {job.briefLinkNote && job.briefLinkNote.trim() && (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {job.briefLinkNote}
            </p>
          )}
          {hasBriefText && (
            <div className="rounded-lg bg-muted/25 p-3 text-sm leading-6">
              <p className="whitespace-pre-wrap">{job.brief}</p>
            </div>
          )}
          {!hasBriefContent && (
            <p className="rounded-lg bg-muted/25 p-3 text-sm text-muted-foreground">
              {t("briefEmpty")}
            </p>
          )}
          <BriefAttachments jobId={id} files={briefDocs} onChanged={load} />
        </CardContent>
      </Card>

      {(jobIncome || job.isBrotherJob) && (
        <Card className="gap-4 py-4 shadow-sm md:py-5">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-base">{t("income")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5">
            {job.isBrotherJob ? (
              <Badge
                variant="outline"
                className="text-xs bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800"
              >
                {t("brotherBadge")}
              </Badge>
            ) : jobIncome ? (
              <>
                <dl className="grid gap-3 sm:hidden">
                  <DetailItem label={t("grossAmount")}>
                    <span className="tabular-nums">
                      {formatTHB(jobIncome.grossAmount)} THB
                    </span>
                  </DetailItem>
                  <DetailItem label={t("withholdingRate")}>
                    <span className="tabular-nums">
                      {jobIncome.withholdingAmount > 0 && jobIncome.grossAmount > 0
                        ? `${Math.round((jobIncome.withholdingAmount / jobIncome.grossAmount) * 100 * 100) / 100}%`
                        : "—"}
                    </span>
                  </DetailItem>
                  <DetailItem label={tDashboard("withholding")}>
                    <span className="tabular-nums">
                      {jobIncome.withholdingAmount > 0
                        ? `${formatTHB(jobIncome.withholdingAmount)} THB`
                        : "—"}
                    </span>
                  </DetailItem>
                  <DetailItem label={tDashboard("net")}>
                    <span className="tabular-nums">
                      {formatTHB(jobIncome.netAmount)} THB
                    </span>
                  </DetailItem>
                </dl>
                <div className="hidden overflow-hidden rounded-lg border sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{t("grossAmount")}</TableHead>
                        <TableHead className="text-right">
                          {t("withholdingRate")}
                        </TableHead>
                        <TableHead className="text-right">
                          {tDashboard("withholding")}
                        </TableHead>
                        <TableHead className="text-right">
                          {tDashboard("net")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-right tabular-nums">
                          {formatTHB(jobIncome.grossAmount)} THB
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {jobIncome.withholdingAmount > 0 && jobIncome.grossAmount > 0
                            ? `${Math.round((jobIncome.withholdingAmount / jobIncome.grossAmount) * 100 * 100) / 100}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {jobIncome.withholdingAmount > 0
                            ? `${formatTHB(jobIncome.withholdingAmount)} THB`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatTHB(jobIncome.netAmount)} THB
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {!job.isBrotherJob && <JobInvoices jobId={id} />}

      {hasAnyDate && (
        <Card className="gap-4 py-4 shadow-sm md:py-5">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-base">{t("dates")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {job.receivedDate != null && job.receivedDate !== "" && (
                <DetailItem
                  label={t("receivedDate")}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                >
                  {formatDateThai(job.receivedDate)}
                </DetailItem>
              )}
              {job.reviewDeadline != null && job.reviewDeadline !== "" && (
                <DetailItem
                  label={t("reviewDeadline")}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                >
                  <span
                    className={
                      isNearReviewDeadline(job.reviewDeadline)
                        ? "rounded px-1 font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : undefined
                    }
                  >
                    {formatDateThai(job.reviewDeadline)}
                  </span>
                </DetailItem>
              )}
              {job.publishDate != null && job.publishDate !== "" && (
                <DetailItem
                  label={t("publishDate")}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                >
                  <span
                    className={
                      isPublishDatePassed(job.publishDate)
                        ? "rounded px-1 font-medium bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                        : undefined
                    }
                  >
                    {formatDateThai(job.publishDate)}
                  </span>
                </DetailItem>
              )}
              {job.paymentDate != null && job.paymentDate !== "" && (
                <DetailItem
                  label={t("paymentDate")}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                >
                  {formatDateThai(job.paymentDate)}
                </DetailItem>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {job.notes && (
        <Card className="gap-4 py-4 shadow-sm md:py-5">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-base">{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5">
            <p className="rounded-lg bg-muted/25 p-3 text-sm leading-6 whitespace-pre-wrap">
              {job.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {showEvidence && evidenceDocs.length > 0 && (
        <Card className="gap-4 py-4 shadow-sm md:py-5">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-base">{t("evidenceImages")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {evidenceDocs.map((doc) => (
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
                    loading={deletingDocId === doc.id}
                    className="absolute right-2 top-2 h-11 w-11 opacity-100 transition-opacity data-[loading]:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 md:h-8 md:w-8 [@media(hover:hover)]:opacity-0"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    {deletingDocId === doc.id ? null : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_1fr_auto] gap-2">
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
            className="min-h-11 w-full"
          />
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            {tCommon("edit")}
          </Button>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="top-0 max-h-[100dvh] max-w-full translate-y-0 gap-0 rounded-none border-0 p-0 sm:top-[50%] sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:translate-y-[-50%] sm:rounded-lg sm:border md:max-w-3xl">
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle className="text-xl">{t("editJob")}</DialogTitle>
            <DialogDescription>{t("jobFormHint")}</DialogDescription>
          </DialogHeader>
          <div className="px-4 py-5 sm:px-6">
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
          </div>
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
