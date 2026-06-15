"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "@/components/ui/dialog";
import { JobForm } from "./JobForm";
import { BriefAttachments } from "./BriefAttachments";
import { AddToCalendarButton } from "./AddToCalendarButton";
import {
  reviewJobCreateSchema,
  REVIEW_JOB_STATUSES,
} from "@/lib/schemas/reviewJob";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Trash2,
  ExternalLink,
  Copy,
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

/**
 * If `link` points at a provider we can embed, return an iframe-able URL so the
 * brief renders inline. Handles public Canva design links (`.../view?embed`)
 * and Google Docs/Slides/Sheets (`/edit` → `/preview`). Returns null otherwise
 * (we just show an "open" button). Private docs show the provider's own
 * permission wall inside the iframe.
 */
function briefLinkEmbed(link: string): string | null {
  try {
    const u = new URL(link);
    const host = u.hostname.toLowerCase();
    // Canva public design view link
    if (
      (host === "canva.com" || host.endsWith(".canva.com")) &&
      u.pathname.includes("/design/")
    ) {
      return `${u.origin}${u.pathname}?embed`;
    }
    // Google Docs / Slides / Sheets — swap the trailing action for /preview
    if (host === "docs.google.com") {
      const m = u.pathname.match(
        /^\/(document|presentation|spreadsheets)\/d\/([^/]+)/,
      );
      if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
    }
    // Google Drive shared file (PDF, image, doc) — `/file/d/<id>/preview`
    if (host === "drive.google.com") {
      const m = u.pathname.match(/^\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
    return null;
  } catch {
    return null;
  }
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

      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">{t("brief")}</CardTitle>
            {(hasBriefLink || hasBriefText) && (
              <div className="flex flex-wrap gap-2">
                {hasBriefLink && (
                  <Button variant="outline" size="sm" asChild>
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
        <CardContent className="space-y-4">
          {briefEmbedUrl && (
            <div className="relative w-full overflow-hidden rounded-lg border bg-muted/30 pt-[56.25%]">
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
              className="flex items-center gap-2 break-all rounded-lg border bg-muted/30 px-4 py-3 text-sm text-primary"
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
            <p className="whitespace-pre-wrap text-sm">{job.brief}</p>
          )}
          {!hasBriefContent && (
            <p className="text-sm text-muted-foreground">{t("briefEmpty")}</p>
          )}
          <BriefAttachments jobId={id} files={briefDocs} onChanged={load} />
        </CardContent>
      </Card>

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

      {(jobIncome || job.isBrotherJob) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("income")}</CardTitle>
          </CardHeader>
          <CardContent>
            {job.isBrotherJob ? (
              <Badge
                variant="outline"
                className="text-xs bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800"
              >
                {t("brotherBadge")}
              </Badge>
            ) : jobIncome ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t("grossAmount")}</TableHead>
                    <TableHead className="text-right">{t("withholdingRate")}</TableHead>
                    <TableHead className="text-right">{tDashboard("withholding")}</TableHead>
                    <TableHead className="text-right">{tDashboard("net")}</TableHead>
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
                    <TableCell className="text-right tabular-nums">
                      {formatTHB(jobIncome.netAmount)} THB
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>
      )}

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

      {showEvidence && evidenceDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("evidenceImages")}</CardTitle>
          </CardHeader>
          <CardContent>
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
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 data-[loading]:opacity-100"
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby={undefined}>
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
