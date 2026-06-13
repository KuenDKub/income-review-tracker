"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PlatformBadges } from "@/components/jobs/PlatformBadges";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatDateThai } from "@/lib/formatDate";
import { formatTHB } from "@/lib/currency";
import { StatusPicker } from "./StatusPicker";
import type { JobItem } from "./types";

type JobSheetProps = {
  job: JobItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (job: JobItem, status: string) => void;
  busy?: boolean;
};

function JobSheetBody({
  job,
  onMove,
  busy,
}: {
  job: JobItem;
  onMove: (job: JobItem, status: string) => void;
  busy?: boolean;
}) {
  const t = useTranslations("jobs");

  const dates: Array<{ label: string; value?: string | null }> = [
    { label: t("receivedDate"), value: job.receivedDate },
    { label: t("reviewDeadline"), value: job.reviewDeadline },
    { label: t("publishDate"), value: job.publishDate },
    { label: t("paymentDate"), value: job.paymentDate },
  ];

  return (
    <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="space-y-1">
        {job.payerName && (
          <p className="text-sm text-muted-foreground">{job.payerName}</p>
        )}
        {job.netAmount != null && (
          <p className="text-sm font-medium tabular-nums">
            {t("budget")}: {formatTHB(job.netAmount)} ฿
          </p>
        )}
        <PlatformBadges platforms={job.platforms ?? []} className="gap-1 pt-1" />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-muted/50 p-3 text-sm">
        {dates
          .filter((d) => d.value)
          .map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-medium">{formatDateThai(value!)}</dd>
            </div>
          ))}
      </dl>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t("moveToStatus")}</h4>
        <StatusPicker
          current={job.status}
          disabled={busy}
          onSelect={(status) => onMove(job, status)}
        />
      </div>

      <Button variant="outline" className="min-h-[44px] w-full" asChild>
        <Link href={`/jobs/${job.id}`}>
          <ExternalLink className="size-4" />
          {t("viewDetails")}
        </Link>
      </Button>
    </div>
  );
}

export function JobSheet({ job, open, onOpenChange, onMove, busy }: JobSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (!job) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85dvh] overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="pr-8 text-left leading-snug">
              {job.title}
            </DialogTitle>
          </DialogHeader>
          <JobSheetBody job={job} onMove={onMove} busy={busy} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-3">
        <SheetHeader className="px-4 pt-1 pb-0">
          <SheetTitle className="text-base leading-snug">{job.title}</SheetTitle>
        </SheetHeader>
        <JobSheetBody job={job} onMove={onMove} busy={busy} />
      </SheetContent>
    </Sheet>
  );
}
