"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Globe, Building2, CalendarDays, Info, Inbox } from "lucide-react";
import { MonthlySummaryCard } from "./MonthlySummaryCard";
import { YearlySummaryCard } from "./YearlySummaryCard";
import { RecentJobsList } from "./RecentJobsList";

type DashboardSummaryProps = {
  monthlyGross?: number;
  monthlyWithholding?: number;
  monthlyNet?: number;
  yearlyGross?: number;
  yearlyWithholding?: number;
  yearlyNet?: number;
  recentJobs?: Array<{ id: string; title: string; receivedDate: string | null }>;
  topPlatform?: { name: string; count: number } | null;
  topPayer?: { name: string; count: number } | null;
  topMonth?: { year: number; month: number; count: number } | null;
};

function formatMonthYear(year: number, month: number, locale: string): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function DashboardSummary({
  monthlyGross = 0,
  monthlyWithholding = 0,
  monthlyNet = 0,
  yearlyGross = 0,
  yearlyWithholding = 0,
  yearlyNet = 0,
  recentJobs = [],
  topPlatform = null,
  topPayer = null,
  topMonth = null,
}: DashboardSummaryProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <MonthlySummaryCard
          gross={monthlyGross}
          withholding={monthlyWithholding}
          net={monthlyNet}
        />
        <YearlySummaryCard
          gross={yearlyGross}
          withholding={yearlyWithholding}
          net={yearlyNet}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </span>
            {t("jobStats")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              {t("topPlatform")}:
            </span>
            {topPlatform ? (
              <span className="font-medium">
                {topPlatform.name} — {t("jobsCount", { count: topPlatform.count })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Inbox className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t("noData")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              {t("topPayer")}:
            </span>
            {topPayer ? (
              <span className="font-medium">
                {topPayer.name} — {t("jobsCount", { count: topPayer.count })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Inbox className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t("noData")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0" />
              {t("topMonth")}:
            </span>
            {topMonth ? (
              <span className="font-medium">
                {formatMonthYear(topMonth.year, topMonth.month, locale)} —{" "}
                {t("jobsCount", { count: topMonth.count })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Inbox className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t("noData")}
              </span>
            )}
          </div>
          <p className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {t("dataSourceNote")}
          </p>
        </CardContent>
      </Card>

      <RecentJobsList jobs={recentJobs} />
    </div>
  );
}
