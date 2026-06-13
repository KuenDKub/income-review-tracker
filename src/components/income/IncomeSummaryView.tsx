"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTHB } from "@/lib/currency";
import { SummaryHeroCard } from "@/components/dashboard/SummaryHeroCard";
import { AlertCircle, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function IncomeSummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[212px] rounded-2xl" />
        <Skeleton className="h-[212px] rounded-2xl" />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex justify-between gap-2 rounded-md border py-2 px-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

type SummaryData = {
  monthly: { gross: number; withholding: number; net: number };
  yearly: { gross: number; withholding: number; net: number };
  byMonth: Array<{
    month: number;
    year: number;
    gross: number;
    withholding: number;
    net: number;
  }>;
};

const MONTH_NAMES_TH = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export function IncomeSummaryView() {
  const t = useTranslations("income");
  const tDashboard = useTranslations("dashboard");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/income/summary?year=${year}&month=${month}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { data: SummaryData }) => {
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
  }, [year, month]);

  if (error && !data) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground"
      >
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="text-muted-foreground">{t("loadingError")}</p>
      </div>
    );
  }

  if (!data && !error) {
    return <IncomeSummarySkeleton />;
  }

  const summary = data ?? {
    monthly: { gross: 0, withholding: 0, net: 0 },
    yearly: { gross: 0, withholding: 0, net: 0 },
    byMonth: [],
  };

  const years = [currentYear, currentYear - 1, currentYear - 2];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const maxAmount = Math.max(
    1,
    ...summary.byMonth.map((row) => Math.max(row.gross, row.net))
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(parseInt(v, 10))}
            >
              <SelectTrigger
                size="sm"
                className="min-h-[40px]"
                aria-label={tDashboard("yearlySummary")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(parseInt(v, 10))}
            >
              <SelectTrigger
                size="sm"
                className="min-h-[40px]"
                aria-label={tDashboard("monthlySummary")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {MONTH_NAMES_TH[m - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryHeroCard
          label={tDashboard("monthlySummary")}
          periodLabel={`${MONTH_NAMES_TH[month - 1]} ${year}`}
          gross={summary.monthly.gross}
          withholding={summary.monthly.withholding}
          net={summary.monthly.net}
        />
        <SummaryHeroCard
          label={tDashboard("yearlySummary")}
          periodLabel={String(year)}
          gross={summary.yearly.gross}
          withholding={summary.yearly.withholding}
          net={summary.yearly.net}
        />
      </div>

      {summary.byMonth.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
                <CalendarDays className="h-4 w-4" />
              </span>
              {t("byMonthTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {summary.byMonth.map((row) => {
                const isSelected = row.month === month && row.year === year;
                const grossPct = Math.round((row.gross / maxAmount) * 100);
                const netPct = Math.round((row.net / maxAmount) * 100);
                return (
                  <li key={`${row.year}-${row.month}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setYear(row.year);
                        setMonth(row.month);
                      }}
                      className={cn(
                        "grid w-full cursor-pointer touch-manipulation grid-cols-[3.5rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {MONTH_NAMES_TH[row.month - 1]}
                      </span>
                      <span className="relative block h-2.5 min-w-0 overflow-hidden rounded-full bg-muted">
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 rounded-full bg-violet-400/45"
                          style={{ width: `${grossPct}%` }}
                        />
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 rounded-full bg-primary"
                          style={{ width: `${netPct}%` }}
                        />
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatTHB(row.net)}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          THB
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-4 rounded-full bg-primary" />
                {tDashboard("net")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="h-2 w-4 rounded-full bg-violet-400/45"
                />
                {tDashboard("gross")}
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
