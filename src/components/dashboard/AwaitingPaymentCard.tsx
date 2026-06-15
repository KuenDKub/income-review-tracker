"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AlertCircle, Clock, Copy, HandCoins, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateThai } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type AwaitingItem = {
  id: string;
  title: string;
  payerName: string | null;
  status: string;
  platforms: string[];
  sinceDate: string | null;
  ageDays: number;
};

type AwaitingResponse = {
  data: { awaiting: AwaitingItem[]; missingCerts: number };
};

/** Aging tone: red >45d, amber >14d, muted otherwise. */
function ageTone(days: number): string {
  if (days > 45) return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200";
  if (days > 14)
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
  return "bg-muted text-muted-foreground";
}

export function AwaitingPaymentCard() {
  const t = useTranslations("payments");
  const [data, setData] = useState<AwaitingResponse["data"] | null>(null);

  useEffect(() => {
    fetch("/api/payments/awaiting")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: AwaitingResponse) => setData(json.data))
      .catch(() => setData({ awaiting: [], missingCerts: 0 }));
  }, []);

  if (data === null) {
    return <Skeleton className="h-44 rounded-2xl" />;
  }

  const { awaiting, missingCerts } = data;

  async function copyFollowUp(item: AwaitingItem) {
    const message = t("followUpTemplate", {
      payer: item.payerName ?? t("thereFallback"),
      title: item.title,
    });
    try {
      await navigator.clipboard.writeText(message);
      toast.success(t("followUpCopied"));
    } catch {
      toast.error(t("followUpCopyError"));
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
              <HandCoins className="size-4" />
            </span>
            {t("awaitingTitle")}
          </h2>
          {awaiting.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {awaiting.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {missingCerts > 0 && (
          <Link
            href="/tax"
            className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900 transition-colors hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200"
          >
            <Receipt className="size-3.5 shrink-0" />
            {t("missingCerts", { count: missingCerts })}
          </Link>
        )}

        {awaiting.length === 0 ? (
          <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <AlertCircle className="size-4" />
            {t("awaitingEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {awaiting.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/jobs/${item.id}`}
                    className="block truncate text-sm font-medium hover:text-primary"
                  >
                    {item.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {item.payerName && (
                      <span className="truncate">{item.payerName}</span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
                        ageTone(item.ageDays),
                      )}
                    >
                      <Clock className="size-3" />
                      {item.ageDays > 0
                        ? t("ageDays", { days: item.ageDays })
                        : formatDateThai(item.sinceDate)}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyFollowUp(item)}
                  aria-label={t("copyFollowUp")}
                  title={t("copyFollowUp")}
                >
                  <Copy className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
