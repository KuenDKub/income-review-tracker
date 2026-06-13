"use client";

import { useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import { SummaryAmountCard } from "./SummaryAmountCard";

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
    <SummaryAmountCard
      title={t("yearlySummary")}
      icon={CalendarDays}
      gross={gross}
      withholding={withholding}
      net={net}
      className="h-full"
    />
  );
}
