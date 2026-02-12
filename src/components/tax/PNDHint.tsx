"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

type PNDHintProps = {
  message?: string;
};

export function PNDHint({ message }: PNDHintProps) {
  const t = useTranslations("tax");
  const text = message ?? t("pndHint");
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <CardContent className="pt-6">
        <p className="text-sm text-amber-800 dark:text-amber-200">{text}</p>
      </CardContent>
    </Card>
  );
}
