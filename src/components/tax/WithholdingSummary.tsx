"use client";

import { useTranslations } from "next-intl";
import { SummaryHeroCard } from "@/components/dashboard/SummaryHeroCard";

type WithholdingSummaryProps = {
  periodLabel: string;
  totalWithholding: number;
  totalGross: number;
  totalNet: number;
};

export function WithholdingSummary({
  periodLabel,
  totalWithholding,
  totalGross,
  totalNet,
}: WithholdingSummaryProps) {
  const t = useTranslations("tax");
  return (
    <SummaryHeroCard
      label={t("withholdingSummary", { period: periodLabel })}
      gross={totalGross}
      withholding={totalWithholding}
      net={totalNet}
    />
  );
}
