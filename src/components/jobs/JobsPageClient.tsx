"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { JobList, type JobItem } from "./JobList";
import { JobForm } from "./JobForm";
import { reviewJobCreateSchema, REVIEW_JOB_STATUSES } from "@/lib/schemas/reviewJob";
import type { ReviewJobStatus } from "@/lib/schemas/reviewJob";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "@/lib/toast";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import type { z } from "zod";
import { Download } from "lucide-react";

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
  grossAmount?: number | null;
  isBrotherJob?: boolean;
};

type Paginated<T> = { data: T[]; total: number; page: number; pageSize: number };

export function JobsPageClient() {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [payerNames, setPayerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [payerNameFilter, setPayerNameFilter] = useState("");
  const [platform, setPlatform] = useState("");
  const [contentType, setContentType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [existingEvidenceImages, setExistingEvidenceImages] = useState<Array<{ id: string; url: string }>>([]);

  const fetchJobs = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("pageSize", String(pageSize));
      if (search.trim()) qs.set("search", search.trim());
      if (payerNameFilter.trim()) qs.set("payerName", payerNameFilter.trim());
      if (platform.trim()) qs.set("platform", platform.trim());
      if (contentType.trim()) qs.set("contentType", contentType.trim());
      const res = await fetch(`/api/jobs?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("loadingError"));
      return json as Paginated<ReviewJobJson>;
    } catch (e) {
      toast.error(t("loadingError"), String(e));
      return { data: [], total: 0, page, pageSize } as Paginated<ReviewJobJson>;
    }
  }, [page, pageSize, search, payerNameFilter, platform, contentType, t]);

  const fetchPayerNames = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs/payer-names");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch payer names");
      return (json.data ?? []) as string[];
    } catch {
      return [];
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [jobsData, namesData] = await Promise.all([fetchJobs(), fetchPayerNames()]);
    setJobs(
      (jobsData.data ?? []).map((j) => ({
        id: j.id,
        title: j.title,
        platforms: j.platforms || [],
        contentType: j.contentType,
        payerName: j.payerName ?? undefined,
        status: j.status,
        receivedDate: j.receivedDate ?? undefined,
        reviewDeadline: j.reviewDeadline ?? undefined,
        publishDate: j.publishDate ?? undefined,
        paymentDate: j.paymentDate ?? undefined,
        grossAmount: j.grossAmount ?? undefined,
        isBrotherJob: j.isBrotherJob ?? false,
      }))
    );
    setTotal(jobsData.total ?? 0);
    setSelectedIds(new Set());
    setPayerNames(namesData);
    setLoading(false);
  }, [fetchJobs, fetchPayerNames]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setEvidenceFiles([]);
    setExistingEvidenceImages([]);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDialogSubmit = async (data: z.infer<typeof reviewJobCreateSchema>) => {
    try {
      let jobId: string;
      if (editingId) {
        const res = await fetch(`/api/jobs/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("updateError"));
        jobId = editingId;
        toast.success(t("updateSuccess"));
      } else {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("createError"));
        jobId = json.data.id;
        toast.success(t("createSuccess"));
      }

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
              reviewJobId: jobId,
              kind: "evidence",
              filePath: uploadJson.filePath,
            }),
          });
        }
        setEvidenceFiles([]);
      }

      setDialogOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      toast.error(editingId ? t("updateError") : t("createError"), String(e));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/jobs/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? t("deleteError"));
      }
      toast.success(t("deleteSuccess"));
      setDeleteId(null);
      await load();
    } catch (e) {
      toast.error(t("deleteError"), String(e));
    }
  };

  const [editDefaultValues, setEditDefaultValues] = useState<Partial<z.infer<typeof reviewJobCreateSchema>> | undefined>(undefined);

  useEffect(() => {
    if (!dialogOpen || !editingId) {
      setEditDefaultValues(undefined);
      setExistingEvidenceImages([]);
      setEvidenceFiles([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch(`/api/jobs/${editingId}`).then((r) => r.json()),
      fetch(`/api/documents?reviewJobId=${editingId}`).then((r) => r.json()),
      fetch(`/api/income?reviewJobId=${editingId}&pageSize=1`).then((r) => r.json()),
    ])
      .then(([jobJson, docsJson, incomeJson]) => {
        if (cancelled || !jobJson.data) return;
        const d = jobJson.data as ReviewJobJson;
        const status: ReviewJobStatus = REVIEW_JOB_STATUSES.includes(d.status as ReviewJobStatus)
          ? (d.status as ReviewJobStatus)
          : "received";
        const incomeList = (incomeJson?.data ?? []) as Array<{
          grossAmount: number;
          withholdingAmount: number;
          netAmount: number;
        }>;
        const firstIncome = incomeList[0];
        const isBrotherJob = d.isBrotherJob === true;
        const incomeDefaults =
          isBrotherJob
            ? { isBrotherJob: true as const }
            : firstIncome &&
              (firstIncome.grossAmount > 0 || firstIncome.netAmount > 0)
              ? firstIncome.withholdingAmount > 0
                ? {
                    hasWithholdingTax: true as const,
                    netAmount: firstIncome.netAmount,
                    withholdingAmount: firstIncome.withholdingAmount,
                  }
                : {
                    hasWithholdingTax: false as const,
                    amount: firstIncome.grossAmount,
                  }
              : { hasWithholdingTax: false as const };
        setEditDefaultValues({
          payerName: d.payerName ?? "",
          status,
          platforms: d.platforms || [],
          contentType: d.contentType,
          title: d.title,
          receivedDate: d.receivedDate ?? "",
          reviewDeadline: d.reviewDeadline ?? "",
          publishDate: d.publishDate ?? "",
          paymentDate: d.paymentDate ?? "",
          tags: d.tags,
          notes: d.notes,
          ...incomeDefaults,
        });
        const docs = (docsJson.data ?? []) as Array<{ id: string; filePath: string }>;
        setExistingEvidenceImages(
          docs
            .filter((doc) => doc.filePath)
            .map((doc) => ({ id: doc.id, url: doc.filePath }))
        );
      })
      .catch(() => {
        setEditDefaultValues(undefined);
        setExistingEvidenceImages([]);
      });
    return () => { cancelled = true; };
  }, [dialogOpen, editingId]);

  const showForm = dialogOpen && (editingId === null || editDefaultValues !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">{t("title")}</h1>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          {t("createJob")}
        </Button>
      </div>
      <Card>
        <CardContent className="space-y-4 px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder={`${tCommon("search")}...`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                placeholder={t("payerName")}
                value={payerNameFilter}
                onChange={(e) => {
                  setPayerNameFilter(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                placeholder={t("platform")}
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                placeholder={t("contentType")}
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <Button type="button" variant="outline" disabled className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                {tCommon("export")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setSearch("");
                  setPayerNameFilter("");
                  setPlatform("");
                  setContentType("");
                  setPage(1);
                }}
              >
                {tCommon("reset")}
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
          ) : (
            <JobList
              jobs={jobs}
              onEdit={handleEdit}
              onDelete={handleDelete}
              selectedIds={selectedIds}
              onToggleSelected={(id) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
              onToggleAllSelected={() => {
                setSelectedIds((prev) => {
                  const allSelected = jobs.length > 0 && jobs.every((j) => prev.has(j.id));
                  if (allSelected) return new Set();
                  return new Set(jobs.map((j) => j.id));
                });
              }}
            />
          )}

          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            rowsLabel={tCommon("rows")}
            ofLabel={tCommon("of")}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(ps) => {
              setPageSize(ps);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t("editJob") : t("createJob")}</DialogTitle>
          </DialogHeader>
          {showForm && (
            <JobForm
              schema={reviewJobCreateSchema}
              defaultValues={editingId ? editDefaultValues : undefined}
              onSubmit={handleDialogSubmit}
              submitLabel={tCommon("save")}
              payerNames={payerNames}
              evidenceFiles={evidenceFiles}
              onEvidenceFilesChange={setEvidenceFiles}
              existingEvidenceImages={existingEvidenceImages}
              onRemoveExistingEvidence={async (docId) => {
                try {
                  const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
                  if (!res.ok) throw new Error(t("deleteDocError"));
                  setExistingEvidenceImages((prev) => prev.filter((img) => img.id !== docId));
                  toast.success(t("removeImageSuccess"));
                } catch (e) {
                  toast.error(t("removeImageError"), String(e));
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
