"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTHB } from "@/lib/currency";
import { TaxPeriodSelector } from "./TaxPeriodSelector";
import { WithholdingSummary } from "./WithholdingSummary";
import { PNDHint } from "./PNDHint";
import { AlertCircle, Calculator, HandCoins, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

function TaxSummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-[212px] rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[260px] rounded-2xl" />
        <Skeleton className="h-[120px] rounded-2xl" />
      </div>
      <Skeleton className="h-14 rounded-xl" />
    </div>
  );
}

type TaxSummaryData = {
  year: number;
  yearlyGross: number;
  yearlyWithholding: number;
  yearlyNet: number;
  personalAllowance: number;
  taxableIncome: number;
  taxLiability: number;
  taxPayable: number;
  refund: boolean;
  refundAmount: number;
};

const currentYear = new Date().getFullYear();

export function TaxSummaryView() {
  const t = useTranslations("tax");
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<TaxSummaryData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tax/summary?year=${year}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { data: TaxSummaryData }) => {
        if (cancelled) return;
        setData(json.data);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  if (error && !data) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground"
      >
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="text-muted-foreground">{t("summaryPlaceholder")}</p>
      </div>
    );
  }

  if (!data) {
    return <TaxSummarySkeleton />;
  }

  const periodLabel = String(data.year);

  const breakdownRows: Array<{
    label: string;
    amount: number;
    operator?: "minus" | "equals";
    emphasized?: boolean;
  }> = [
    { label: t("totalGross"), amount: data.yearlyGross },
    {
      label: t("personalAllowance"),
      amount: data.personalAllowance,
      operator: "minus",
    },
    {
      label: t("taxableIncome"),
      amount: data.taxableIncome,
      operator: "equals",
      emphasized: true,
    },
    { label: t("taxLiability"), amount: data.taxLiability },
    {
      label: t("totalWithholding"),
      amount: data.yearlyWithholding,
      operator: "minus",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={t("title")}
        actions={<TaxPeriodSelector selectedYear={year} onYearChange={setYear} />}
      />

      <WithholdingSummary
        periodLabel={periodLabel}
        totalGross={data.yearlyGross}
        totalWithholding={data.yearlyWithholding}
        totalNet={data.yearlyNet}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Receipt-style calculation breakdown */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
                <Calculator className="h-4 w-4" />
              </span>
              {t("taxLiability")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y divide-dashed">
              {breakdownRows.map(({ label, amount, operator, emphasized }) => (
                <li
                  key={label}
                  className={cn(
                    "flex items-baseline justify-between gap-3 py-2.5 text-sm",
                    emphasized && "font-semibold"
                  )}
                >
                  <span
                    className={cn(
                      "flex min-w-0 items-baseline gap-2",
                      emphasized ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {operator && (
                      <span
                        aria-hidden
                        className="w-3 shrink-0 text-center font-mono text-muted-foreground/70"
                      >
                        {operator === "minus" ? "−" : "="}
                      </span>
                    )}
                    {!operator && <span aria-hidden className="w-3 shrink-0" />}
                    <span className="min-w-0">{label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatTHB(amount)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      THB
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Result hero card */}
        <Card
          className={cn(
            "relative flex flex-col justify-center overflow-hidden rounded-2xl",
            data.refund
              ? "border-green-300/60 bg-green-50/60 dark:border-green-900 dark:bg-green-950/20"
              : "border-primary/10 bg-gradient-to-br from-primary/[0.08] via-card to-violet-500/[0.07]"
          )}
        >
          {!data.refund && (
            <span
              aria-hidden
              className="pointer-events-none absolute -right-14 -top-16 size-44 rounded-full bg-primary/15 blur-3xl"
            />
          )}
          <CardContent className="relative z-10 flex items-center gap-4 py-6">
            <span
              aria-hidden
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                data.refund
                  ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                  : "bg-gradient-to-br from-primary/15 to-violet-500/20 text-primary"
              )}
            >
              {data.refund ? (
                <PiggyBank className="size-7" />
              ) : (
                <HandCoins className="size-7" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                {data.refund ? t("refund") : t("taxPayable")}
              </p>
              <p
                className={cn(
                  "text-3xl font-bold tabular-nums tracking-tight",
                  data.refund && "text-green-700 dark:text-green-300"
                )}
              >
                {data.refund
                  ? formatTHB(data.refundAmount)
                  : formatTHB(data.taxPayable)}
                <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                  THB
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <PNDHint />
    </div>
  );
}
