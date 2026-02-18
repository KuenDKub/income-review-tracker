"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTHB } from "@/lib/currency";
import { MonthlySummaryCard } from "@/components/dashboard/MonthlySummaryCard";
import { YearlySummaryCard } from "@/components/dashboard/YearlySummaryCard";
import { AlertCircle } from "lucide-react";
import { CalendarDays } from "lucide-react";

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
        <Card className="min-h-[180px] border-l-4 border-l-primary/30">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="min-h-[180px] border-l-4 border-l-primary/30">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
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
  const tCommon = useTranslations("common");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{tDashboard("yearlySummary")}</span>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{tDashboard("monthlySummary")}</span>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {MONTH_NAMES_TH[m - 1]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MonthlySummaryCard
          gross={summary.monthly.gross}
          withholding={summary.monthly.withholding}
          net={summary.monthly.net}
        />
        <YearlySummaryCard
          gross={summary.yearly.gross}
          withholding={summary.yearly.withholding}
          net={summary.yearly.net}
        />
      </div>

      {summary.byMonth.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="h-4 w-4" />
              </span>
              {t("byMonthTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {summary.byMonth.map((row) => (
                <li
                  key={row.month}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border py-2 px-3 text-sm"
                >
                  <span className="font-medium">
                    {MONTH_NAMES_TH[row.month - 1]} {row.year}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {tDashboard("gross")}: {formatTHB(row.gross)} · {tDashboard("net")}: {formatTHB(row.net)} THB
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
