"use client";

import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB } from "@/lib/currency";
import { cn } from "@/lib/utils";

type SummaryAmountCardProps = {
  title: string;
  icon: LucideIcon;
  gross: number;
  withholding: number;
  net: number;
  highlight?: boolean;
  className?: string;
};

/**
 * Income summary card with the net amount as the hero number and
 * gross / withholding as secondary stats below.
 */
export function SummaryAmountCard({
  title,
  icon: Icon,
  gross,
  withholding,
  net,
  highlight = false,
  className,
}: SummaryAmountCardProps) {
  const t = useTranslations("dashboard");

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        highlight && "border-primary/30 bg-primary/5",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-6 size-24 rounded-full bg-primary/5"
      />
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <p className="text-xs text-muted-foreground">{t("net")}</p>
        <p className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {formatTHB(net)}
          <span className="ml-1 text-sm font-medium text-muted-foreground">
            THB
          </span>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {t("gross")}
            </p>
            <p className="truncate text-sm font-semibold tabular-nums">
              {formatTHB(gross)}
            </p>
          </div>
          <div className="min-w-0 border-l pl-3">
            <p className="truncate text-xs text-muted-foreground">
              {t("withholding")}
            </p>
            <p className="truncate text-sm font-semibold tabular-nums">
              {formatTHB(withholding)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
