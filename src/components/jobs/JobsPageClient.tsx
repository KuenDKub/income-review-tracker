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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobList, type JobItem } from "./JobList";
import { JobForm } from "./JobForm";
import { reviewJobCreateSchema } from "@/lib/schemas/reviewJob";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "@/lib/toast";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import type { z } from "zod";
import { Download } from "lucide-react";

type ReviewJobJson = {
  id: string;
  payerId: string;
  platforms: string[];
  contentType: string;
  title: string;
  jobDate: string;
  tags: string[];
  notes: string | null;
};

type PayerJson = { id: string; name: string };
type Paginated<T> = { data: T[]; total: number; page: number; pageSize: number };

export function JobsPageClient() {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [payers, setPayers] = useState<PayerJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [payerId, setPayerId] = useState<string>("all");
  const [platform, setPlatform] = useState("");
  const [contentType, setContentType] = useState("");
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [jobDateFrom, setJobDateFrom] = useState("");
  const [jobDateTo, setJobDateTo] = useState("");
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
      if (payerId !== "all") qs.set("payerId", payerId);
      if (platform.trim()) qs.set("platform", platform.trim());
      if (contentType.trim()) qs.set("contentType", contentType.trim());
      if (year !== "all") qs.set("year", year);
      if (month !== "all") qs.set("month", month);
      if (jobDateFrom) qs.set("jobDateFrom", jobDateFrom);
      if (jobDateTo) qs.set("jobDateTo", jobDateTo);
      const res = await fetch(`/api/jobs?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch jobs");
      return json as Paginated<ReviewJobJson>;
    } catch (e) {
      toast.error("Failed to load jobs", String(e));
      return { data: [], total: 0, page, pageSize } as Paginated<ReviewJobJson>;
    }
  }, [page, pageSize, search, payerId, platform, contentType, year, month, jobDateFrom, jobDateTo]);

  const fetchPayers = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      qs.set("page", "1");
      qs.set("pageSize", "100");
      const res = await fetch(`/api/payers?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch payers");
      return (json.data ?? []) as PayerJson[];
    } catch (e) {
      toast.error("Failed to load payers", String(e));
      return [];
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [jobsData, payersData] = await Promise.all([fetchJobs(), fetchPayers()]);
    const payerMap = new Map(payersData.map((p) => [p.id, p.name]));
    setJobs(
      (jobsData.data ?? []).map((j) => ({
        id: j.id,
        title: j.title,
        platforms: j.platforms || [],
        contentType: j.contentType,
        jobDate: j.jobDate,
        payerName: payerMap.get(j.payerId),
      }))
    );
    setTotal(jobsData.total ?? 0);
    setSelectedIds(new Set());
    setPayers(payersData);
    setLoading(false);
  }, [fetchJobs, fetchPayers]);

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
        if (!res.ok) throw new Error(json.error ?? "Failed to update job");
        jobId = editingId;
        toast.success("Job updated");
      } else {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to create job");
        jobId = json.data.id;
        toast.success("Job created");
      }

      // Upload evidence files if any
      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) {
            throw new Error("Failed to upload file");
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
      toast.error(editingId ? "Failed to update job" : "Failed to create job", String(e));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/jobs/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to delete job");
      }
      toast.success("Job deleted");
      setDeleteId(null);
      await load();
    } catch (e) {
      toast.error("Failed to delete job", String(e));
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
    ])
      .then(([jobJson, docsJson]) => {
        if (cancelled || !jobJson.data) return;
        const d = jobJson.data;
        setEditDefaultValues({
          payerId: d.payerId,
          platforms: d.platforms || [],
          contentType: d.contentType,
          title: d.title,
          jobDate: d.jobDate,
          tags: d.tags,
          notes: d.notes,
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button onClick={handleOpenCreate}>{t("createJob")}</Button>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-7">
              <Input
                placeholder={`${tCommon("search")}...`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={payerId}
                onValueChange={(v) => {
                  setPayerId(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Payer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payers</SelectItem>
                  {payers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Platform"
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                placeholder="Content type"
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={year}
                onValueChange={(v) => {
                  setYear(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={month}
                onValueChange={(v) => {
                  setMonth(v);
                  setPage(1);
                }}
                disabled={year === "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {new Date(2000, m - 1).toLocaleString("en-US", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={jobDateFrom}
                  onChange={(e) => {
                    setJobDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
                <Input
                  type="date"
                  value={jobDateTo}
                  onChange={(e) => {
                    setJobDateTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                {tCommon("export")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setPayerId("all");
                  setPlatform("");
                  setContentType("");
                  setYear("all");
                  setMonth("all");
                  setJobDateFrom("");
                  setJobDateTo("");
                  setPage(1);
                }}
              >
                {tCommon("reset")}
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
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
              payers={payers}
              evidenceFiles={evidenceFiles}
              onEvidenceFilesChange={setEvidenceFiles}
              existingEvidenceImages={existingEvidenceImages}
              onRemoveExistingEvidence={async (docId) => {
                try {
                  const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
                  if (!res.ok) throw new Error("Failed to delete document");
                  setExistingEvidenceImages((prev) => prev.filter((img) => img.id !== docId));
                  toast.success("Image removed");
                } catch (e) {
                  toast.error("Failed to remove image", String(e));
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
