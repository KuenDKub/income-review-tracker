"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSummary } from "./DashboardSummary";

function DashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <Skeleton className="h-[212px] rounded-xl" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-11 flex-1 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex justify-between gap-2 py-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
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
  recentJobs: Array<{ id: string; title: string; receivedDate: string | null }>;
  topPlatform: { name: string; count: number } | null;
  topPayer: { name: string; count: number } | null;
  topMonth: { year: number; month: number; count: number } | null;
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

  if (data === null) {
    return <DashboardSkeleton />;
  }

  const summary = data;
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
