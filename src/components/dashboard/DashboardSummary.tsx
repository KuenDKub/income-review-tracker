"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  BarChart3,
  Globe,
  Building2,
  CalendarDays,
  Info,
  Plus,
  Wallet,
  Columns,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatTile } from "@/components/ui/stat-tile";
import { SummaryHeroCard } from "./SummaryHeroCard";
import { RecentJobsList } from "./RecentJobsList";

type Period = "month" | "year";

function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const t = useTranslations("dashboard");
  const options: Array<{ key: Period; label: string }> = [
    { key: "month", label: t("periodMonth") },
    { key: "year", label: t("periodYear") },
  ];

  return (
    <div
      role="tablist"
      aria-label={t("period")}
      className="inline-flex rounded-full border bg-muted/50 p-0.5 text-xs font-medium"
    >
      {options.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors touch-manipulation",
            value === key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function QuickActions() {
  const t = useTranslations("dashboard");
  const tIncome = useTranslations("income");

  return (
    <section
      aria-label={t("quickActions")}
      className="flex flex-wrap items-center gap-2"
    >
      <Link
        href="/jobs?new=1"
        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-violet-500 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all touch-manipulation hover:opacity-90 active:scale-[0.98]"
      >
        <Plus className="size-4" />
        {t("addJob")}
      </Link>
      <Link
        href="/jobs-dnd"
        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium transition-all touch-manipulation hover:bg-primary/5 active:scale-[0.98]"
      >
        <Columns className="size-4 text-primary" />
        {t("openBoard")}
      </Link>
      <Link
        href="/income"
        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium transition-all touch-manipulation hover:bg-primary/5 active:scale-[0.98]"
      >
        <Wallet className="size-4 text-primary" />
        {tIncome("title")}
      </Link>
    </section>
  );
}

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
  const [period, setPeriod] = useState<Period>("month");

  const now = new Date();
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(now);
  const yearLabel = String(now.getFullYear());

  const isMonth = period === "month";
  const gross = isMonth ? monthlyGross : yearlyGross;
  const withholding = isMonth ? monthlyWithholding : yearlyWithholding;
  const net = isMonth ? monthlyNet : yearlyNet;
  const periodLabel = isMonth ? monthLabel : yearLabel;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Hero — net income with take-home rate */}
      <SummaryHeroCard
        label={t("net")}
        periodLabel={periodLabel}
        gross={gross}
        withholding={withholding}
        net={net}
        headerRight={<PeriodToggle value={period} onChange={setPeriod} />}
      />

      <QuickActions />

      {/* Job stats */}
      <section aria-label={t("jobStats")} className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
            <BarChart3 className="size-4" />
          </span>
          {t("jobStats")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            icon={Globe}
            tone="primary"
            label={t("topPlatform")}
            value={topPlatform ? topPlatform.name : t("noData")}
            sublabel={
              topPlatform
                ? t("jobsCount", { count: topPlatform.count })
                : undefined
            }
            className="rounded-2xl"
          />
          <StatTile
            icon={Building2}
            tone="primary"
            label={t("topPayer")}
            value={topPayer ? topPayer.name : t("noData")}
            sublabel={
              topPayer ? t("jobsCount", { count: topPayer.count }) : undefined
            }
            className="rounded-2xl"
          />
          <StatTile
            icon={CalendarDays}
            tone="primary"
            label={t("topMonth")}
            value={
              topMonth
                ? formatMonthYear(topMonth.year, topMonth.month, locale)
                : t("noData")
            }
            sublabel={
              topMonth ? t("jobsCount", { count: topMonth.count }) : undefined
            }
            className="rounded-2xl"
          />
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {t("dataSourceNote")}
        </p>
      </section>

      <RecentJobsList jobs={recentJobs} />
    </div>
  );
}
