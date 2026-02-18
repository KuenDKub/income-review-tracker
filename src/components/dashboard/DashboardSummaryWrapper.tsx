"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSummary } from "./DashboardSummary";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
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
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
