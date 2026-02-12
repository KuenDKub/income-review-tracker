"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JobTableRow } from "./JobTableRow";
import { Checkbox } from "@/components/ui/checkbox";

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
  const canSelect = Boolean(selectedIds && onToggleSelected && onToggleAllSelected);
  const allSelected = canSelect && jobs.every((j) => selectedIds!.has(j.id));
  return (
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
          {showActions && <TableHead className="text-right w-[140px]">{tCommon("action")}</TableHead>}
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
            onToggleSelected={canSelect ? () => onToggleSelected!(job.id) : undefined}
          />
        ))}
      </TableBody>
    </Table>
  );
}
