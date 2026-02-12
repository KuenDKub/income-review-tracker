"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB } from "@/lib/currency";
import { CalendarDays, Banknote, Receipt, Wallet } from "lucide-react";

type YearlySummaryCardProps = {
  gross: number;
  withholding: number;
  net: number;
};

export function YearlySummaryCard({
  gross,
  withholding,
  net,
}: YearlySummaryCardProps) {
  const t = useTranslations("dashboard");

  return (
    <Card className="min-h-[180px] border-l-4 border-l-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </span>
          {t("yearlySummary")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Banknote className="h-4 w-4 shrink-0" />
            {t("gross")}
          </span>
          <span className="font-medium tabular-nums">
            {formatTHB(gross)} THB
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4 shrink-0" />
            {t("withholding")}
          </span>
          <span className="font-medium tabular-nums">
            {formatTHB(withholding)} THB
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 shrink-0" />
            {t("net")}
          </span>
          <span className="font-medium tabular-nums">
            {formatTHB(net)} THB
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
