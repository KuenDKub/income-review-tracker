"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { DashboardSummary } from "./DashboardSummary";

type SummaryData = {
  monthly: { gross: number; withholding: number; net: number };
  yearly: { gross: number; withholding: number; net: number };
  recentJobs: Array<{ id: string; title: string; receivedDate: string | null }>;
  topPlatform: { name: string; count: number } | null;
  topPayer: { name: string; count: number } | null;
  topMonth: { year: number; month: number; count: number } | null;
};

const emptyData: SummaryData = {
  monthly: { gross: 0, withholding: 0, net: 0 },
  yearly: { gross: 0, withholding: 0, net: 0 },
  recentJobs: [],
  topPlatform: null,
  topPayer: null,
  topMonth: null,
};

export function DashboardSummaryWrapper() {
  const t = useTranslations("dashboard");
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    fetch(`/api/dashboard/summary?year=${year}&month=${month}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { data: SummaryData }) => setData(json.data))
      .catch(() => setError(true));
  }, []);

  const summary = data ?? emptyData;
  if (error && !data) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground"
      >
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="text-muted-foreground">{t("loadError")}</p>
      </div>
    );
  }

  return (
    <DashboardSummary
      monthlyGross={summary.monthly.gross}
      monthlyWithholding={summary.monthly.withholding}
      monthlyNet={summary.monthly.net}
      yearlyGross={summary.yearly.gross}
      yearlyWithholding={summary.yearly.withholding}
      yearlyNet={summary.yearly.net}
      recentJobs={summary.recentJobs}
      topPlatform={summary.topPlatform ?? null}
      topPayer={summary.topPayer ?? null}
      topMonth={summary.topMonth ?? null}
    />
  );
}
