"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import type { JobItem } from "./JobList";
import { PlatformBadges } from "./PlatformBadges";
import { AddToCalendarButton } from "./AddToCalendarButton";
import { formatTHB } from "@/lib/currency";
import {
  formatDateThai,
  isNearReviewDeadline,
  isPublishDatePassed,
} from "@/lib/formatDate";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_CLASS, DEFAULT_STATUS_BADGE_CLASS } from "./statusBadge";

const STATUS_KEYS: Record<string, string> = {
  received: "statusReceived",
  script_sent: "statusScriptSent",
  in_progress: "statusInProgress",
  waiting_edit: "statusWaitingEdit",
  waiting_review: "statusWaitingReview",
  approved_pending: "statusApprovedPending",
  paid: "statusPaid",
};

type JobTableRowProps = {
  job: JobItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onToggleSelected?: () => void;
};

export function JobTableRow({
  job,
  onEdit,
  onDelete,
  selected,
  onToggleSelected,
}: JobTableRowProps) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const canSelect = typeof selected === "boolean" && Boolean(onToggleSelected);
  return (
    <TableRow>
      {canSelect && (
        <TableCell className="w-[40px]">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelected?.()}
            aria-label={tCommon("selectRow")}
          />
        </TableCell>
      )}
      <TableCell>
        <Link
          href={`/jobs/${job.id}`}
          className="font-medium text-primary hover:underline"
        >
          {job.title}
        </Link>
      </TableCell>
      <TableCell>
        <PlatformBadges platforms={job.platforms ?? []} />
      </TableCell>
      <TableCell>{job.contentType}</TableCell>
      <TableCell>{job.payerName ?? "—"}</TableCell>
      <TableCell>
        {job.status ? (
          <Badge
            variant="outline"
            className={
              STATUS_BADGE_CLASS[job.status] ?? DEFAULT_STATUS_BADGE_CLASS
            }
          >
            {t(STATUS_KEYS[job.status] ?? "statusReceived")}
          </Badge>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>{formatDateThai(job.receivedDate)}</TableCell>
      <TableCell>
        <span
          className={
            isNearReviewDeadline(job.reviewDeadline)
              ? "rounded px-1 font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              : undefined
          }
        >
          {formatDateThai(job.reviewDeadline)}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={
            isPublishDatePassed(job.publishDate)
              ? "rounded px-1 font-medium bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
              : undefined
          }
        >
          {formatDateThai(job.publishDate)}
        </span>
      </TableCell>
      <TableCell>{formatDateThai(job.paymentDate)}</TableCell>
      <TableCell className="text-right">
        {job.isBrotherJob ? (
          <Badge
            variant="outline"
            className="text-xs bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800"
          >
            {t("brotherBadge")}
          </Badge>
        ) : job.grossAmount != null ? (
          `${formatTHB(job.grossAmount)} THB`
        ) : (
          "—"
        )}
      </TableCell>
      {(onEdit || onDelete) && (
        <TableCell className="text-right">
          <div className="flex justify-end items-center gap-1">
            <AddToCalendarButton
              job={{
                title: job.title,
                platforms: job.platforms,
                contentType: job.contentType,
                payerName: job.payerName,
                reviewDeadline: job.reviewDeadline ?? null,
                publishDate: job.publishDate ?? null,
              }}
              variant="ghost"
              size="icon"
              iconOnly
            />
            <Button
              type="button"
              variant="ghost"
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
                variant="ghost"
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
                variant="ghost"
                size="icon"
                onClick={() => onDelete(job.id)}
                aria-label={tCommon("delete")}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
