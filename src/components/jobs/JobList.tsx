"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JobTableRow } from "./JobTableRow";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformBadges } from "./PlatformBadges";
import { AddToCalendarButton } from "./AddToCalendarButton";
import { Button } from "@/components/ui/button";
import { formatTHB } from "@/lib/currency";
import { formatDateThai } from "@/lib/formatDate";
import { Eye, Pencil, Trash2 } from "lucide-react";

const STATUS_KEYS: Record<string, string> = {
  received: "statusReceived",
  script_sent: "statusScriptSent",
  in_progress: "statusInProgress",
  waiting_edit: "statusWaitingEdit",
  waiting_review: "statusWaitingReview",
  approved_pending: "statusApprovedPending",
  paid: "statusPaid",
};

export type JobItem = {
  id: string;
  title: string;
  platforms: string[];
  contentType: string;
  payerName?: string;
  status?: string;
  receivedDate?: string | null;
  reviewDeadline?: string | null;
  publishDate?: string | null;
  paymentDate?: string | null;
  grossAmount?: number | null;
};

type JobListProps = {
  jobs: JobItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string) => void;
  onToggleAllSelected?: () => void;
};

export function JobList({
  jobs,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelected,
  onToggleAllSelected,
}: JobListProps) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noJobsFound")}</p>;
  }
  const showActions = Boolean(onEdit || onDelete);
  const canSelect = Boolean(
    selectedIds && onToggleSelected && onToggleAllSelected,
  );
  const allSelected = canSelect && jobs.every((j) => selectedIds!.has(j.id));
  return (
    <div className="space-y-3">
      <div className="lg:hidden space-y-3">
        {canSelect && (
          <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
            <div className="text-sm text-muted-foreground">
              {tCommon("selectAll")}
            </div>
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => onToggleAllSelected?.()}
              aria-label={tCommon("selectAll")}
            />
          </div>
        )}

        {jobs.map((job) => {
          const selected = canSelect ? selectedIds!.has(job.id) : undefined;
          return (
            <Card key={job.id} className="py-4">
              <CardContent className="px-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="block font-medium text-primary hover:underline leading-snug wrap-break-word"
                    >
                      {job.title}
                    </Link>
                    <div className="mt-2">
                      <PlatformBadges platforms={job.platforms ?? []} />
                    </div>
                  </div>

                  {canSelect && (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onToggleSelected?.(job.id)}
                      aria-label={tCommon("selectRow")}
                    />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("status")}
                    </div>
                    <div className="mt-0.5">
                      {job.status
                        ? t(STATUS_KEYS[job.status] ?? "statusReceived")
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("payer")}
                    </div>
                    <div className="mt-0.5 wrap-break-word">
                      {job.payerName ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("reviewDeadline")}
                    </div>
                    <div className="mt-0.5">{formatDateThai(job.reviewDeadline)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("paymentDate")}
                    </div>
                    <div className="mt-0.5">{formatDateThai(job.paymentDate)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">
                      {t("income")}
                    </div>
                    <div className="mt-0.5 tabular-nums">
                      {job.grossAmount != null
                        ? `${formatTHB(job.grossAmount)} THB`
                        : "—"}
                    </div>
                  </div>
                </div>

                {showActions && (
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <AddToCalendarButton
                      job={{
                        title: job.title,
                        platforms: job.platforms,
                        contentType: job.contentType,
                        payerName: job.payerName,
                        reviewDeadline: job.reviewDeadline ?? null,
                        publishDate: job.publishDate ?? null,
                      }}
                      variant="outline"
                      size="icon"
                      iconOnly
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      asChild
                      aria-label={tCommon("view")}
                    >
                      <Link href={`/jobs/${job.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {onEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(job.id)}
                        aria-label={tCommon("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onDelete(job.id)}
                        aria-label={tCommon("delete")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              {canSelect && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => onToggleAllSelected?.()}
                    aria-label={tCommon("selectAll")}
                  />
                </TableHead>
              )}
              <TableHead>{t("table.title")}</TableHead>
              <TableHead>{t("table.platform")}</TableHead>
              <TableHead>{t("table.contentType")}</TableHead>
              <TableHead>{t("payer")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("receivedDate")}</TableHead>
              <TableHead>{t("reviewDeadline")}</TableHead>
              <TableHead>{t("publishDate")}</TableHead>
              <TableHead>{t("paymentDate")}</TableHead>
              <TableHead className="text-right">{t("income")}</TableHead>
              {showActions && (
                <TableHead className="text-right w-[140px]">
                  {tCommon("action")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <JobTableRow
                key={job.id}
                job={job}
                onEdit={onEdit}
                onDelete={onDelete}
                selected={canSelect ? selectedIds!.has(job.id) : undefined}
                onToggleSelected={
                  canSelect ? () => onToggleSelected!(job.id) : undefined
                }
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
