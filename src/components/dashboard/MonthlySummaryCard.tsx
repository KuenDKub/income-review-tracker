"use client";

import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import { SummaryAmountCard } from "./SummaryAmountCard";

type MonthlySummaryCardProps = {
  gross: number;
  withholding: number;
  net: number;
};

export function MonthlySummaryCard({
  gross,
  withholding,
  net,
}: MonthlySummaryCardProps) {
  const t = useTranslations("dashboard");

  return (
    <SummaryAmountCard
      title={t("monthlySummary")}
      icon={Calendar}
      gross={gross}
      withholding={withholding}
      net={net}
      highlight
    />
  );
}
