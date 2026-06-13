"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";

type PNDHintProps = {
  message?: string;
};

export function PNDHint({ message }: PNDHintProps) {
  const t = useTranslations("tax");
  const text = message ?? t("pndHint");
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-900 dark:bg-violet-950/30"
    >
      <Info
        className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400"
        aria-hidden
      />
      <p className="text-sm leading-relaxed text-violet-800 dark:text-violet-200">
        {text}
      </p>
    </div>
  );
}
