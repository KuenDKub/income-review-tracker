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
import { IncomeTable, type IncomeItem } from "./IncomeTable";
import { IncomeForm } from "./IncomeForm";
import { incomeCreateSchema } from "@/lib/schemas/income";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "@/lib/toast";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import type { z } from "zod";
import { Download } from "lucide-react";

type IncomeJson = {
  id: string;
  reviewJobId: string;
  grossAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  netAmount: number;
  paymentDate: string;
  currency: string;
};

type ReviewJobJson = { id: string; title: string };
type Paginated<T> = { data: T[]; total: number; page: number; pageSize: number };

export function IncomePageClient() {
  const t = useTranslations("income");
  const tCommon = useTranslations("common");
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [jobs, setJobs] = useState<ReviewJobJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [reviewJobId, setReviewJobId] = useState<string>("all");
  const [currency, setCurrency] = useState<string>("all");
  const [paymentDateFrom, setPaymentDateFrom] = useState("");
  const [paymentDateTo, setPaymentDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchIncome = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("pageSize", String(pageSize));
      if (search.trim()) qs.set("search", search.trim());
      if (reviewJobId !== "all") qs.set("reviewJobId", reviewJobId);
      if (currency !== "all") qs.set("currency", currency);
      if (paymentDateFrom) qs.set("paymentDateFrom", paymentDateFrom);
      if (paymentDateTo) qs.set("paymentDateTo", paymentDateTo);
      const res = await fetch(`/api/income?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch income");
      return json as Paginated<IncomeJson>;
    } catch (e) {
      toast.error("Failed to load income", String(e));
      return { data: [], total: 0, page, pageSize } as Paginated<IncomeJson>;
    }
  }, [page, pageSize, search, reviewJobId, currency, paymentDateFrom, paymentDateTo]);

  const fetchJobs = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      qs.set("page", "1");
      qs.set("pageSize", "100");
      const res = await fetch(`/api/jobs?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch jobs");
      return (json.data ?? []).map((j: { id: string; title: string }) => ({ id: j.id, title: j.title })) as ReviewJobJson[];
    } catch {
      return [];
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [incomeData, jobsData] = await Promise.all([fetchIncome(), fetchJobs()]);
    setItems(
      (incomeData.data ?? []).map((i) => ({
        id: i.id,
        grossAmount: i.grossAmount,
        withholdingAmount: i.withholdingAmount,
        netAmount: i.netAmount,
        paymentDate: i.paymentDate,
        currency: i.currency,
      }))
    );
    setTotal(incomeData.total ?? 0);
    setSelectedIds(new Set());
    setJobs(jobsData);
    setLoading(false);
  }, [fetchIncome, fetchJobs]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const toNumber = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0);

  const handleDialogSubmit = async (data: z.infer<typeof incomeCreateSchema>) => {
    try {
      const payload = {
        reviewJobId: data.reviewJobId,
        grossAmount: toNumber(data.grossAmount),
        withholdingRate: toNumber(data.withholdingRate ?? 3),
        paymentDate: data.paymentDate,
        currency: data.currency ?? "THB",
      };
      if (editingId) {
        const res = await fetch(`/api/income/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to update income");
        toast.success("Income updated");
      } else {
        const res = await fetch("/api/income", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to create income");
        toast.success("Income created");
      }
      setDialogOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      toast.error(editingId ? "Failed to update income" : "Failed to create income", String(e));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/income/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to delete income");
      }
      toast.success("Income deleted");
      setDeleteId(null);
      await load();
    } catch (e) {
      toast.error("Failed to delete income", String(e));
    }
  };

  const [editDefaultValues, setEditDefaultValues] = useState<Partial<z.infer<typeof incomeCreateSchema>> | undefined>(undefined);

  useEffect(() => {
    if (!dialogOpen || !editingId) {
      setEditDefaultValues(undefined);
      return;
    }
    let cancelled = false;
    fetch(`/api/income/${editingId}`)
      .then((r) => r.json())
      .then((json: { data?: IncomeJson }) => {
        if (cancelled || !json.data) return;
        const d = json.data;
        setEditDefaultValues({
          reviewJobId: d.reviewJobId,
          grossAmount: d.grossAmount,
          withholdingRate: d.withholdingRate,
          withholdingAmount: d.withholdingAmount,
          netAmount: d.netAmount,
          paymentDate: d.paymentDate,
          currency: d.currency,
        });
      })
      .catch(() => setEditDefaultValues(undefined));
    return () => { cancelled = true; };
  }, [dialogOpen, editingId]);

  const showForm = dialogOpen && (editingId === null || editDefaultValues !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button onClick={handleOpenCreate}>{t("createIncome")}</Button>
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder={`${tCommon("search")} (job title)...`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={reviewJobId}
                onValueChange={(v) => {
                  setReviewJobId(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All jobs</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={currency}
                onValueChange={(v) => {
                  setCurrency(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All currencies</SelectItem>
                  <SelectItem value="THB">THB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={paymentDateFrom}
                  onChange={(e) => {
                    setPaymentDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
                <Input
                  type="date"
                  value={paymentDateTo}
                  onChange={(e) => {
                    setPaymentDateTo(e.target.value);
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
                  setReviewJobId("all");
                  setCurrency("all");
                  setPaymentDateFrom("");
                  setPaymentDateTo("");
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
            <IncomeTable
              items={items}
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
                  const allSelected = items.length > 0 && items.every((i) => prev.has(i.id));
                  if (allSelected) return new Set();
                  return new Set(items.map((i) => i.id));
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
            <DialogTitle>{editingId ? t("editIncome") : t("createIncome")}</DialogTitle>
          </DialogHeader>
          {showForm && (
            <IncomeForm
              schema={incomeCreateSchema}
              defaultValues={editingId ? editDefaultValues : undefined}
              onSubmit={handleDialogSubmit}
              submitLabel={tCommon("save")}
              jobs={jobs}
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
