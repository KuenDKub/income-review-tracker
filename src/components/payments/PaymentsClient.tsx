"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AlertCircle,
  Clock,
  Copy,
  Download,
  Check,
  HandCoins,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { BlurFade } from "@/components/ui/blur-fade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateThai } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type AwaitingItem = {
  id: string;
  title: string;
  payerName: string | null;
  status: string;
  platforms: string[];
  sinceDate: string | null;
  ageDays: number;
};

type OutstandingInvoice = {
  id: string;
  reviewJobId: string;
  invoiceNumber: string;
  jobTitle: string;
  payerName: string | null;
  dueDate: string | null;
  total: number;
  currency: string;
  daysUntilDue: number;
  overdue: boolean;
};

/** Aging tone for awaiting items: red >45d, amber >14d, muted otherwise. */
function ageTone(days: number): string {
  if (days > 45) return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200";
  if (days > 14)
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
  return "bg-muted text-muted-foreground";
}

/** Due tone for invoices: red overdue, amber due within 7d, muted otherwise. */
function dueTone(overdue: boolean, days: number): string {
  if (overdue) return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200";
  if (days <= 7)
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
  return "bg-muted text-muted-foreground";
}

export function PaymentsClient() {
  const t = useTranslations("payments");
  const tInv = useTranslations("invoices");
  const locale = useLocale();
  const [awaiting, setAwaiting] = useState<AwaitingItem[] | null>(null);
  const [invoices, setInvoices] = useState<OutstandingInvoice[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [aRes, iRes] = await Promise.all([
      fetch("/api/payments/awaiting").then((r) => (r.ok ? r.json() : { data: {} })),
      fetch("/api/invoices").then((r) => (r.ok ? r.json() : { data: [] })),
    ]);
    setAwaiting((aRes?.data?.awaiting ?? []) as AwaitingItem[]);
    setInvoices((iRes?.data ?? []) as OutstandingInvoice[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function copyFollowUp(item: AwaitingItem) {
    const message = t("followUpTemplate", {
      payer: item.payerName ?? t("thereFallback"),
      title: item.title,
    });
    try {
      await navigator.clipboard.writeText(message);
      toast.success(t("followUpCopied"));
    } catch {
      toast.error(t("followUpCopyError"));
    }
  }

  async function markPaid(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (!res.ok) throw new Error("error");
      toast.success(t("markedPaid"));
      await load();
    } catch {
      toast.error(tInv("updateError"));
    } finally {
      setBusyId(null);
    }
  }

  const loading = awaiting === null || invoices === null;
  const totalOutstanding = (invoices ?? []).reduce((sum, i) => sum + i.total, 0);
  const currency = invoices?.[0]?.currency ?? "THB";

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <PageHeader title={t("title")} description={t("subtitle")} />
      </BlurFade>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <BlurFade delay={80} className="grid gap-4 lg:grid-cols-2">
          {/* Outstanding invoices (accounts receivable) */}
          <Card className="rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
                  <FileText className="size-4" />
                </span>
                {t("tabInvoices")}
                {invoices.length > 0 && (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
                    {totalOutstanding.toLocaleString("en-US")} {currency}
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t("invoicesDesc")}</p>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <AlertCircle className="size-4" />
                  {t("invoicesEmpty")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link
                          href={`/jobs/${inv.reviewJobId}`}
                          className="block truncate text-sm font-medium hover:text-primary"
                        >
                          {inv.invoiceNumber} · {inv.jobTitle}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {inv.payerName && <span className="truncate">{inv.payerName}</span>}
                          <span className="tabular-nums">
                            {inv.total.toLocaleString("en-US")} {inv.currency}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
                              dueTone(inv.overdue, inv.daysUntilDue),
                            )}
                          >
                            <Clock className="size-3" />
                            {!inv.dueDate
                              ? t("noDueDate")
                              : inv.overdue
                                ? t("overdueBy", { days: Math.abs(inv.daysUntilDue) })
                                : inv.daysUntilDue === 0
                                  ? t("dueToday")
                                  : t("dueIn", { days: inv.daysUntilDue })}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button asChild variant="ghost" size="icon" title={t("download")}>
                          <a href={`/api/invoices/${inv.id}/docx?locale=${locale}`} download>
                            <Download className="size-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("markPaid")}
                          disabled={busyId === inv.id}
                          onClick={() => markPaid(inv.id)}
                        >
                          <Check className="size-4 text-emerald-600" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Awaiting payment (delivered, no income recorded) */}
          <Card className="rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
                  <HandCoins className="size-4" />
                </span>
                {t("tabAwaiting")}
                {awaiting.length > 0 && (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {awaiting.length}
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t("awaitingDesc")}</p>
            </CardHeader>
            <CardContent>
              {awaiting.length === 0 ? (
                <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <AlertCircle className="size-4" />
                  {t("awaitingEmpty")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {awaiting.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link
                          href={`/jobs/${item.id}`}
                          className="block truncate text-sm font-medium hover:text-primary"
                        >
                          {item.title}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {item.payerName && <span className="truncate">{item.payerName}</span>}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
                              ageTone(item.ageDays),
                            )}
                          >
                            <Clock className="size-3" />
                            {item.ageDays > 0
                              ? t("ageDays", { days: item.ageDays })
                              : formatDateThai(item.sinceDate)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => copyFollowUp(item)}
                        aria-label={t("copyFollowUp")}
                        title={t("copyFollowUp")}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </BlurFade>
      )}
    </div>
  );
}
