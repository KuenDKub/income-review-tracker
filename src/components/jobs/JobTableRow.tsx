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
        {job.status ? t(STATUS_KEYS[job.status] ?? "statusReceived") : "—"}
      </TableCell>
      <TableCell>{formatDateThai(job.receivedDate)}</TableCell>
      <TableCell>{formatDateThai(job.reviewDeadline)}</TableCell>
      <TableCell>{formatDateThai(job.publishDate)}</TableCell>
      <TableCell>{formatDateThai(job.paymentDate)}</TableCell>
      <TableCell className="text-right">
        {job.grossAmount != null ? `${formatTHB(job.grossAmount)} THB` : "—"}
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
