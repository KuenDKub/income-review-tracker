"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTHB } from "@/lib/currency";
import { TaxPeriodSelector } from "./TaxPeriodSelector";
import { WithholdingSummary } from "./WithholdingSummary";
import { PNDHint } from "./PNDHint";
import { AlertCircle } from "lucide-react";
import { Wallet, Receipt, Banknote } from "lucide-react";

function TaxSummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-primary/30">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-8 w-40" />
        </CardContent>
      </Card>
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
  const tCommon = useTranslations("common");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <TaxPeriodSelector selectedYear={year} onYearChange={setYear} />
      </div>

      <WithholdingSummary
        periodLabel={periodLabel}
        totalGross={data.yearlyGross}
        totalWithholding={data.yearlyWithholding}
        totalNet={data.yearlyNet}
      />

      <Card className="border-l-4 border-l-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("taxLiability")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          <div className="flex justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4 shrink-0" />
              {t("personalAllowance")}
            </span>
            <span className="font-medium tabular-nums">
              {formatTHB(data.personalAllowance)} THB
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Banknote className="h-4 w-4 shrink-0" />
              {t("taxableIncome")}
            </span>
            <span className="font-medium tabular-nums">
              {formatTHB(data.taxableIncome)} THB
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Receipt className="h-4 w-4 shrink-0" />
              {t("taxLiability")}
            </span>
            <span className="font-medium tabular-nums">
              {formatTHB(data.taxLiability)} THB
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{t("totalWithholding")}</span>
            <span className="font-medium tabular-nums">
              {formatTHB(data.yearlyWithholding)} THB
            </span>
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          data.refund
            ? "border-l-4 border-l-green-500/50 bg-green-50/50 dark:bg-green-950/20"
            : "border-l-4 border-l-primary/50 bg-primary/5"
        }
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {data.refund ? t("refund") : t("taxPayable")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-2xl font-semibold tabular-nums">
            {data.refund
              ? `${formatTHB(data.refundAmount)} THB`
              : `${formatTHB(data.taxPayable)} THB`}
          </p>
          {data.refund && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("refundAmount")}: {formatTHB(data.refundAmount)} THB
            </p>
          )}
        </CardContent>
      </Card>

      <PNDHint />
    </div>
  );
}
