"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatDateThai } from "@/lib/formatDate";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList, Inbox } from "lucide-react";

type Job = { id: string; title: string; receivedDate: string | null };

type RecentJobsListProps = {
  jobs: Job[];
};

export function RecentJobsList({ jobs }: RecentJobsListProps) {
  const t = useTranslations("dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </span>
          {t("recentJobs")}
        </CardTitle>
        <CardAction>
          <Link
            href="/jobs"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("viewAll")}
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <EmptyState icon={Inbox} message={t("noRecentJobs")} className="py-8" />
        ) : (
          <ul className="space-y-3 divide-y divide-border">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex-1 text-sm font-medium text-primary hover:underline"
                >
                  {job.title}
                </Link>
                {job.receivedDate && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateThai(job.receivedDate)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
