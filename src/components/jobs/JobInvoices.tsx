"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Download, FileText, Plus, Trash2, Check, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateThai } from "@/lib/formatDate";
import { useConfirm } from "@/components/ui/useConfirm";
import { toast } from "@/lib/toast";

type InvoiceJson = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  total: number;
  status: string;
};

function statusBadgeClass(status: string): string {
  if (status === "paid")
    return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800";
  if (status === "cancelled")
    return "bg-muted text-muted-foreground border-border";
  return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800";
}

export function JobInvoices({ jobId }: { jobId: string }) {
  const t = useTranslations("invoices");
  const locale = useLocale();
  const { confirm, confirmDialog } = useConfirm();
  const [invoices, setInvoices] = useState<InvoiceJson[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/invoice`);
      const json = await res.json();
      setInvoices((json?.data ?? []) as InvoiceJson[]);
    } catch {
      setInvoices([]);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    setCreating(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/invoice`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "error");
      toast.success(t("created", { number: json.data.invoiceNumber }));
      await load();
    } catch {
      toast.error(t("createError"));
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(id: string, status: "paid" | "unpaid" | "cancelled") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("error");
      await load();
    } catch {
      toast.error(t("updateError"));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!(await confirm({ description: t("confirmDelete") }))) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("error");
      toast.success(t("deleted"));
      await load();
    } catch {
      toast.error(t("updateError"));
    } finally {
      setBusyId(null);
    }
  }

  if (invoices === null) {
    return <Skeleton className="h-40 rounded-2xl" />;
  }

  return (
    <Card className="gap-4 py-4 shadow-sm md:py-5">
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 md:px-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-primary" />
          {t("title")}
        </CardTitle>
        <Button size="sm" onClick={create} disabled={creating}>
          <Plus className="size-4" />
          {creating ? t("creating") : t("create")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 px-4 md:px-5">
        {invoices.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">{inv.invoiceNumber}</span>
                    <Badge variant="outline" className={statusBadgeClass(inv.status)}>
                      {t(
                        inv.status === "paid"
                          ? "statusPaid"
                          : inv.status === "cancelled"
                            ? "statusCancelled"
                            : "statusUnpaid",
                      )}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t("issued")} {formatDateThai(inv.issueDate)}
                    {inv.dueDate ? ` · ${t("due")} ${formatDateThai(inv.dueDate)}` : ""}
                    {" · "}
                    <span className="tabular-nums">
                      {inv.total.toLocaleString("en-US")} {inv.currency}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="ghost" size="icon" title={t("download")}>
                    <a
                      href={`/api/invoices/${inv.id}/docx?locale=${locale}`}
                      download
                    >
                      <Download className="size-4" />
                    </a>
                  </Button>
                  {inv.status === "unpaid" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("markPaid")}
                      disabled={busyId === inv.id}
                      onClick={() => setStatus(inv.id, "paid")}
                    >
                      <Check className="size-4 text-emerald-600" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("markUnpaid")}
                      disabled={busyId === inv.id}
                      onClick={() => setStatus(inv.id, "unpaid")}
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("delete")}
                    disabled={busyId === inv.id}
                    onClick={() => remove(inv.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">{t("issuerHint")}</p>
      </CardContent>
      {confirmDialog}
    </Card>
  );
}
