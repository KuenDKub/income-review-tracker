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
import { PayerList, type PayerItem } from "./PayerList";
import { PayerForm } from "./PayerForm";
import { payerCreateSchema } from "@/lib/schemas/payer";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "@/lib/toast";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import type { z } from "zod";
import { Download } from "lucide-react";

type PayerJson = { id: string; name: string; taxId: string | null; contactEmail: string | null };
type Paginated<T> = { data: T[]; total: number; page: number; pageSize: number };

export function PayersPageClient() {
  const t = useTranslations("payers");
  const tCommon = useTranslations("common");
  const [payers, setPayers] = useState<PayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchPayers = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("pageSize", String(pageSize));
      if (search.trim()) qs.set("search", search.trim());
      const res = await fetch(`/api/payers?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch payers");
      return json as Paginated<PayerJson>;
    } catch (e) {
      toast.error("Failed to load payers", String(e));
      return { data: [], total: 0, page, pageSize } as Paginated<PayerJson>;
    }
  }, [page, pageSize, search]);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchPayers();
    setPayers(
      (result.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        taxId: p.taxId,
      }))
    );
    setTotal(result.total ?? 0);
    setSelectedIds(new Set());
    setLoading(false);
  }, [fetchPayers]);

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

  const handleDialogSubmit = async (data: z.infer<typeof payerCreateSchema>) => {
    try {
      if (editingId) {
        const res = await fetch(`/api/payers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, taxId: data.taxId, contactEmail: data.contactEmail ?? null }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to update payer");
        toast.success("Payer updated");
      } else {
        const res = await fetch("/api/payers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, taxId: data.taxId, contactEmail: data.contactEmail ?? null }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to create payer");
        toast.success("Payer created");
      }
      setDialogOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      toast.error(editingId ? "Failed to update payer" : "Failed to create payer", String(e));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/payers/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to delete payer");
      }
      toast.success("Payer deleted");
      setDeleteId(null);
      await load();
    } catch (e) {
      toast.error("Failed to delete payer", String(e));
    }
  };

  const [editDefaultValues, setEditDefaultValues] = useState<Partial<z.infer<typeof payerCreateSchema>> | undefined>(undefined);

  useEffect(() => {
    if (!dialogOpen || !editingId) {
      setEditDefaultValues(undefined);
      return;
    }
    let cancelled = false;
    fetch(`/api/payers/${editingId}`)
      .then((r) => r.json())
      .then((json: { data?: PayerJson }) => {
        if (cancelled || !json.data) return;
        const d = json.data;
        setEditDefaultValues({
          name: d.name,
          taxId: d.taxId,
          contactEmail: d.contactEmail,
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
        <Button onClick={handleOpenCreate}>{t("createPayer")}</Button>
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Input
                placeholder={`${tCommon("search")}...`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
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
            <PayerList
              payers={payers}
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
                  const allSelected = payers.length > 0 && payers.every((p) => prev.has(p.id));
                  if (allSelected) return new Set();
                  return new Set(payers.map((p) => p.id));
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
            <DialogTitle>{editingId ? t("editPayer") : t("createPayer")}</DialogTitle>
          </DialogHeader>
          {showForm && (
            <PayerForm
              schema={payerCreateSchema}
              defaultValues={editingId ? editDefaultValues : undefined}
              onSubmit={handleDialogSubmit}
              submitLabel={tCommon("save")}
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
