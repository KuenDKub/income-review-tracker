"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";
import { NumberTicker } from "@/components/ui/number-ticker";
import { formatTHB } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** Withholding / secondary accent — soft lavender that pairs with brand pink. */
export const WITHHOLDING_COLOR = "#a78bfa"; // violet-400, readable in light & dark

/** CSS-only ring showing take-home rate (net ÷ gross), no chart lib. */
function TakeHomeDonut({ net, gross }: { net: number; gross: number }) {
  const t = useTranslations("dashboard");
  const pct = gross > 0 ? Math.max(0, Math.min(100, (net / gross) * 100)) : null;

  return (
    <div
      role="img"
      aria-label={pct === null ? t("noData") : `${Math.round(pct)}% ${t("takeHome")}`}
      className="relative grid size-28 shrink-0 place-items-center sm:size-32"
    >
      <div
        aria-hidden
        className="size-full rounded-full"
        style={{
          background:
            pct === null
              ? "var(--muted)"
              : `conic-gradient(var(--primary) 0 ${pct}%, ${WITHHOLDING_COLOR} ${pct}% 100%)`,
        }}
      />
      <div className="absolute inset-[15%] grid place-items-center rounded-full bg-card">
        <span className="text-xl font-bold tabular-nums leading-none sm:text-2xl">
          {pct === null ? "—" : `${Math.round(pct)}%`}
        </span>
        <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
          {t("takeHome")}
        </span>
      </div>
    </div>
  );
}

function LegendStat({
  color,
  label,
  value,
  className,
}: {
  color?: string;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            !color && "bg-muted-foreground/40"
          )}
          style={color ? { background: color } : undefined}
        />
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums sm:text-base">
        {formatTHB(value)}
      </p>
    </div>
  );
}

type SummaryHeroCardProps = {
  /** Muted caption shown top-left, e.g. "Net income" or "Monthly summary". */
  label: string;
  /** Optional period appended after the label, e.g. "June 2026". */
  periodLabel?: string;
  gross: number;
  withholding: number;
  net: number;
  /** Slot rendered top-right (e.g. a period toggle). */
  headerRight?: ReactNode;
  className?: string;
};

/**
 * Feminine "fintech" hero: oversized net number + a take-home-rate donut on a
 * soft blush→lavender gradient surface. Shared by the dashboard and income pages.
 */
export function SummaryHeroCard({
  label,
  periodLabel,
  gross,
  withholding,
  net,
  headerRight,
  className,
}: SummaryHeroCardProps) {
  const t = useTranslations("dashboard");

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border-primary/10 bg-gradient-to-br from-primary/[0.07] via-card to-violet-500/[0.06] shadow-sm",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-primary/15 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-12 size-40 rounded-full bg-violet-500/15 blur-3xl"
      />
      <BorderBeam size={140} duration={10} />
      <CardContent className="relative z-10 px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">
            {label}
            {periodLabel ? ` · ${periodLabel}` : ""}
          </p>
          {headerRight}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
              <NumberTicker value={net} decimalPlaces={2} />
              <span className="ml-1.5 text-base font-medium text-muted-foreground">
                THB
              </span>
            </p>
          </div>
          <TakeHomeDonut net={net} gross={gross} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
          <LegendStat label={t("gross")} value={gross} />
          <LegendStat
            color={WITHHOLDING_COLOR}
            label={t("withholding")}
            value={withholding}
            className="border-l pl-3"
          />
        </div>
      </CardContent>
    </Card>
  );
}
