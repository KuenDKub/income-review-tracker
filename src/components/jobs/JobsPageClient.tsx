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
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { JobList, type JobItem } from "./JobList";
import { JobForm } from "./JobForm";
import {
  reviewJobCreateSchema,
  REVIEW_JOB_STATUSES,
} from "@/lib/schemas/reviewJob";
import type { ReviewJobStatus } from "@/lib/schemas/reviewJob";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "@/lib/toast";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { Skeleton } from "@/components/ui/skeleton";
import { statusTheme } from "@/components/board/statusTheme";
import { cn } from "@/lib/utils";
import type { z } from "zod";
import { Search, SlidersHorizontal } from "lucide-react";
import { useQueryState } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Fab } from "@/components/ui/fab";
import { PageHeader } from "@/components/ui/page-header";

function DialogFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

function JobsListSkeleton() {
  return (
    <div>
      <div className="space-y-3 lg:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-0">
            <CardContent className="space-y-3 p-4">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
        <Skeleton className="h-9 w-full rounded-none" />
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-[2.4] space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-28 flex-none" />
              <Skeleton className="h-4 w-24 flex-none" />
              <Skeleton className="h-4 w-20 flex-none" />
              <Skeleton className="h-8 w-32 flex-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STATUS_FILTER_ALL = "__all__";

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
  withholdingAmount?: number | null;
  netAmount?: number | null;
  withholdingRate?: number | null;
  isBrotherJob?: boolean;
  brief?: string | null;
  briefLink?: string | null;
};

type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function JobsPageClient() {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
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
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [existingEvidenceImages, setExistingEvidenceImages] = useState<
    Array<{ id: string; url: string }>
  >([]);
  const [briefFiles, setBriefFiles] = useState<File[]>([]);
  const [existingBriefFiles, setExistingBriefFiles] = useState<
    Array<{ id: string; url: string }>
  >([]);

  const fetchJobs = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("pageSize", String(pageSize));
      if (search.trim()) qs.set("search", search.trim());
      if (payerNameFilter.trim()) qs.set("payerName", payerNameFilter.trim());
      if (platform.trim()) qs.set("platform", platform.trim());
      if (contentType.trim()) qs.set("contentType", contentType.trim());
      if (statusFilter && statusFilter !== STATUS_FILTER_ALL)
        qs.set("status", statusFilter);
      const res = await fetch(`/api/jobs?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("loadingError"));
      return json as Paginated<ReviewJobJson>;
    } catch (e) {
      toast.error(t("loadingError"), String(e));
      return { data: [], total: 0, page, pageSize } as Paginated<ReviewJobJson>;
    }
  }, [
    page,
    pageSize,
    search,
    payerNameFilter,
    platform,
    contentType,
    statusFilter,
    t,
  ]);

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
    const [jobsData, namesData] = await Promise.all([
      fetchJobs(),
      fetchPayerNames(),
    ]);
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
        withholdingAmount: j.withholdingAmount ?? undefined,
        netAmount: j.netAmount ?? undefined,
        withholdingRate: j.withholdingRate ?? undefined,
        isBrotherJob: j.isBrotherJob ?? false,
        hasBrief: Boolean(j.brief?.trim() || j.briefLink?.trim()),
      })),
    );
    setTotal(jobsData.total ?? 0);
    setPayerNames(namesData);
    setLoading(false);
  }, [fetchJobs, fetchPayerNames]);

  useEffect(() => {
    load();
  }, [load]);

  // Deep link from dashboard quick action: /jobs?new=1 opens the create form.
  const [newParam, setNewParam] = useQueryState("new");
  useEffect(() => {
    if (newParam === "1") {
      setEditingId(null);
      setEvidenceFiles([]);
      setExistingEvidenceImages([]);
      setBriefFiles([]);
      setExistingBriefFiles([]);
      setDialogOpen(true);
      void setNewParam(null);
    }
  }, [newParam, setNewParam]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setEvidenceFiles([]);
    setExistingEvidenceImages([]);
    setBriefFiles([]);
    setExistingBriefFiles([]);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDialogSubmit = async (
    data: z.infer<typeof reviewJobCreateSchema>,
  ) => {
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

      const uploadDocs = async (files: File[], kind: "evidence" | "brief") => {
        for (const file of files) {
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
              kind,
              filePath: uploadJson.filePath,
            }),
          });
        }
      };

      if (evidenceFiles.length > 0) {
        await uploadDocs(evidenceFiles, "evidence");
        setEvidenceFiles([]);
      }
      if (briefFiles.length > 0) {
        await uploadDocs(briefFiles, "brief");
        setBriefFiles([]);
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

  const [editDefaultValues, setEditDefaultValues] = useState<
    Partial<z.infer<typeof reviewJobCreateSchema>> | undefined
  >(undefined);

  useEffect(() => {
    if (!dialogOpen || !editingId) {
      setEditDefaultValues(undefined);
      setExistingEvidenceImages([]);
      setEvidenceFiles([]);
      setExistingBriefFiles([]);
      setBriefFiles([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch(`/api/jobs/${editingId}`).then((r) => r.json()),
      fetch(`/api/documents?reviewJobId=${editingId}`).then((r) => r.json()),
      fetch(`/api/income?reviewJobId=${editingId}&pageSize=1`).then((r) =>
        r.json(),
      ),
    ])
      .then(([jobJson, docsJson, incomeJson]) => {
        if (cancelled || !jobJson.data) return;
        const d = jobJson.data as ReviewJobJson;
        const status: ReviewJobStatus = REVIEW_JOB_STATUSES.includes(
          d.status as ReviewJobStatus,
        )
          ? (d.status as ReviewJobStatus)
          : "received";
        const incomeList = (incomeJson?.data ?? []) as Array<{
          grossAmount: number;
          withholdingAmount: number;
          netAmount: number;
        }>;
        const firstIncome = incomeList[0];
        const isBrotherJob = d.isBrotherJob === true;
        const incomeDefaults = isBrotherJob
          ? { isBrotherJob: true as const }
          : firstIncome &&
              (firstIncome.grossAmount > 0 || firstIncome.netAmount > 0)
            ? firstIncome.withholdingAmount > 0
              ? {
                  hasWithholdingTax: true as const,
                  amount: firstIncome.grossAmount,
                  withholdingRate:
                    firstIncome.grossAmount > 0
                      ? (firstIncome.withholdingAmount /
                          firstIncome.grossAmount) *
                        100
                      : 3,
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
        const docs = (docsJson.data ?? []) as Array<{
          id: string;
          filePath: string;
          kind: string;
        }>;
        const withPath = docs.filter((doc) => doc.filePath);
        setExistingEvidenceImages(
          withPath
            .filter((doc) => doc.kind !== "brief")
            .map((doc) => ({ id: doc.id, url: doc.filePath })),
        );
        setExistingBriefFiles(
          withPath
            .filter((doc) => doc.kind === "brief")
            .map((doc) => ({ id: doc.id, url: doc.filePath })),
        );
      })
      .catch(() => {
        setEditDefaultValues(undefined);
        setExistingEvidenceImages([]);
        setExistingBriefFiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [dialogOpen, editingId]);

  const showForm =
    dialogOpen && (editingId === null || editDefaultValues !== undefined);

  const activeFilterCount = [payerNameFilter, platform, contentType].filter(
    (v) => v.trim()
  ).length;

  const resetFilters = () => {
    setSearch("");
    setPayerNameFilter("");
    setStatusFilter(STATUS_FILTER_ALL);
    setPlatform("");
    setContentType("");
    setPage(1);
  };

  const filterFields = (
    <>
      <Input
        placeholder={t("payerName")}
        className="min-h-[44px]"
        value={payerNameFilter}
        onChange={(e) => {
          setPayerNameFilter(e.target.value);
          setPage(1);
        }}
      />
      <Input
        placeholder={t("platform")}
        className="min-h-[44px]"
        value={platform}
        onChange={(e) => {
          setPlatform(e.target.value);
          setPage(1);
        }}
      />
      <Input
        placeholder={t("contentType")}
        className="min-h-[44px]"
        value={contentType}
        onChange={(e) => {
          setContentType(e.target.value);
          setPage(1);
        }}
      />
    </>
  );

  const statusChips: Array<{ value: string; label: string; dot?: string }> = [
    { value: STATUS_FILTER_ALL, label: t("allStatuses") },
    ...REVIEW_JOB_STATUSES.map((s) => ({
      value: s as string,
      label: t(STATUS_KEYS[s] ?? "statusReceived"),
      dot: statusTheme(s).dot,
    })),
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button onClick={handleOpenCreate} className="hidden lg:inline-flex">
            {t("createJob")}
          </Button>
        }
      />
      {/* Toolbar: search + filters */}
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search
            aria-hidden
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder={`${tCommon("search")}...`}
            className="min-h-[44px] pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="relative min-h-[44px]"
          aria-label={tCommon("filters")}
          onClick={() => setFilterSheetOpen(true)}
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">{tCommon("filters")}</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Status chips */}
      <div
        role="tablist"
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {statusChips.map(({ value, label, dot }) => {
          const active = statusFilter === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "inline-flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors active:scale-[0.97]",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
              onClick={() => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              {dot && (
                <span aria-hidden className={cn("size-2 rounded-full", dot)} />
              )}
              <span className="max-w-[16ch] truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <JobsListSkeleton />
      ) : (
        <JobList jobs={jobs} onEdit={handleEdit} onDelete={handleDelete} />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="top-0 max-h-[100dvh] max-w-full translate-y-0 gap-0 rounded-none border-0 p-0 sm:top-[50%] sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:translate-y-[-50%] sm:rounded-lg sm:border md:max-w-3xl">
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle className="text-xl">
              {editingId ? t("editJob") : t("createJob")}
            </DialogTitle>
            <DialogDescription>{t("jobFormHint")}</DialogDescription>
          </DialogHeader>
          <div className="px-4 py-5 sm:px-6">
            {showForm ? (
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
                    const res = await fetch(`/api/documents/${docId}`, {
                      method: "DELETE",
                    });
                    if (!res.ok) throw new Error(t("deleteDocError"));
                    setExistingEvidenceImages((prev) =>
                      prev.filter((img) => img.id !== docId),
                    );
                    toast.success(t("removeImageSuccess"));
                  } catch (e) {
                    toast.error(t("removeImageError"), String(e));
                  }
                }}
                briefFiles={briefFiles}
                onBriefFilesChange={setBriefFiles}
                existingBriefFiles={existingBriefFiles}
                onRemoveExistingBrief={async (docId) => {
                  try {
                    const res = await fetch(`/api/documents/${docId}`, {
                      method: "DELETE",
                    });
                    if (!res.ok) throw new Error(t("deleteDocError"));
                    setExistingBriefFiles((prev) =>
                      prev.filter((f) => f.id !== docId),
                    );
                    toast.success(t("removeImageSuccess"));
                  } catch (e) {
                    toast.error(t("removeImageError"), String(e));
                  }
                }}
              />
            ) : dialogOpen && editingId ? (
              <DialogFormSkeleton />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          showCloseButton={isDesktop}
          className={cn("gap-3", isDesktop && "w-[340px]")}
        >
          <SheetHeader className={cn("px-4 pb-0", isDesktop ? "pt-5" : "pt-1")}>
            <SheetTitle className="text-base">{tCommon("filters")}</SheetTitle>
          </SheetHeader>
          <div className="grid min-h-0 gap-3 overflow-y-auto px-4">
            {filterFields}
          </div>
          <div
            className={cn(
              "flex gap-2 border-t px-4 py-3 [&>button]:min-h-[44px] [&>button]:flex-1",
              isDesktop && "mt-auto"
            )}
          >
            <Button type="button" variant="outline" onClick={resetFilters}>
              {tCommon("reset")}
            </Button>
            <Button type="button" onClick={() => setFilterSheetOpen(false)}>
              {tCommon("done")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Fab aria-label={t("createJob")} onClick={handleOpenCreate} />
    </div>
  );
}
