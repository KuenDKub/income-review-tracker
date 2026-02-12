"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>{t("withholdingSummary", { period: periodLabel })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          {t("totalGross")}: <span className="font-medium">{totalGross.toLocaleString("th-TH")} THB</span>
        </p>
        <p>
          {t("totalWithholding")}:{" "}
          <span className="font-medium">{totalWithholding.toLocaleString("th-TH")} THB</span>
        </p>
        <p>
          {t("totalNet")}: <span className="font-medium">{totalNet.toLocaleString("th-TH")} THB</span>
        </p>
      </CardContent>
    </Card>
  );
}
