"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlatformBadges } from "./PlatformBadges";
import { JobActionsMenu } from "./JobActionsMenu";
import { formatTHB } from "@/lib/currency";
import { formatDateThai } from "@/lib/formatDate";
import { DueChip } from "./DueChip";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";

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
  withholdingAmount?: number | null;
  netAmount?: number | null;
  withholdingRate?: number | null;
  isBrotherJob?: boolean;
  hasBrief?: boolean;
};

type JobListProps = {
  jobs: JobItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function netDisplayOf(job: JobItem): string | null {
  if (job.netAmount != null) return formatTHB(job.netAmount);
  if (job.grossAmount != null) return formatTHB(job.grossAmount);
  return null;
}

/** Small "has a brief" indicator shown in list rows and cards. */
function BriefChip({ label }: { label: string }) {
  return (
    <span
      title={label}
      className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
    >
      <ClipboardList className="h-3 w-3" />
      {label}
    </span>
  );
}

export function JobList({ jobs, onEdit, onDelete }: JobListProps) {
  const t = useTranslations("jobs");
  const tDashboard = useTranslations("dashboard");
  if (jobs.length === 0) {
    return <EmptyState icon={ClipboardList} message={t("noJobsFound")} />;
  }
  const showActions = Boolean(onEdit || onDelete);

  return (
    <div>
      {/* Mobile / tablet: cards */}
      <div className="space-y-3 lg:hidden">
        {jobs.map((job) => {
          const netDisplay = netDisplayOf(job);
          return (
            <Card key={job.id} className="overflow-hidden py-0">
              <CardContent className="p-4">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  {job.status && <StatusBadge status={job.status} />}
                  <DueChip
                    status={job.status}
                    reviewDeadline={job.reviewDeadline}
                    publishDate={job.publishDate}
                  />
                  {job.hasBrief && <BriefChip label={t("brief")} />}
                </div>

                <Link
                  href={`/jobs/${job.id}`}
                  className="mt-2.5 block touch-manipulation"
                >
                  <span className="block text-base font-semibold leading-snug wrap-break-word">
                    {job.title}
                  </span>
                  {job.payerName && (
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {job.payerName}
                    </span>
                  )}
                </Link>

                <div className="mt-2">
                  <PlatformBadges platforms={job.platforms ?? []} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {t("reviewDeadline")}
                    </p>
                    <p className="truncate font-medium">
                      {formatDateThai(job.reviewDeadline)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {t("paymentDate")}
                    </p>
                    <p className="truncate font-medium">
                      {formatDateThai(job.paymentDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                  <div className="min-w-0">
                    {job.isBrotherJob ? (
                      <Badge
                        variant="outline"
                        className="text-xs bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800"
                      >
                        {t("brotherBadge")}
                      </Badge>
                    ) : netDisplay ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {tDashboard("net")}
                        </p>
                        <p className="text-base font-bold tabular-nums leading-tight">
                          {netDisplay}
                          <span className="ml-1 text-xs font-medium text-muted-foreground">
                            THB
                          </span>
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                  {showActions && (
                    <JobActionsMenu
                      job={job}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop: modern row list */}
      <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
        <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.8fr)_8.5rem_8rem_3rem] items-center gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>{t("table.title")}</span>
          <span>{t("status")}</span>
          <span>{t("reviewDeadline")}</span>
          <span className="text-right">{tDashboard("net")}</span>
          <span />
        </div>
        <ul className="divide-y">
          {jobs.map((job) => {
            const netDisplay = netDisplayOf(job);
            return (
              <li
                key={job.id}
                className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.8fr)_8.5rem_8rem_3rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="block truncate font-medium hover:text-primary hover:underline"
                  >
                    {job.title}
                  </Link>
                  <div className="mt-1 flex min-w-0 items-center gap-2">
                    {job.payerName && (
                      <span className="truncate text-xs text-muted-foreground">
                        {job.payerName}
                      </span>
                    )}
                    <PlatformBadges
                      platforms={job.platforms ?? []}
                      className="gap-1"
                    />
                  </div>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  {job.status && <StatusBadge status={job.status} />}
                  <DueChip
                    status={job.status}
                    reviewDeadline={job.reviewDeadline}
                    publishDate={job.publishDate}
                  />
                  {job.hasBrief && <BriefChip label={t("brief")} />}
                </div>

                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatDateThai(job.reviewDeadline)}
                </span>

                <span className="text-right text-sm font-semibold tabular-nums">
                  {job.isBrotherJob ? (
                    <Badge
                      variant="outline"
                      className="text-xs bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800"
                    >
                      {t("brotherBadge")}
                    </Badge>
                  ) : netDisplay ? (
                    netDisplay
                  ) : (
                    "—"
                  )}
                </span>

                <div className="flex justify-end">
                  {showActions && (
                    <JobActionsMenu
                      job={job}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
