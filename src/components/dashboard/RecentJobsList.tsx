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
import { ChevronRight, ClipboardList, FileText, Inbox } from "lucide-react";

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
          <ul className="space-y-1">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="-mx-2 flex min-h-[52px] items-center gap-3 rounded-xl px-2 py-2 transition-colors touch-manipulation hover:bg-muted active:bg-muted"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {job.title}
                    </span>
                    {job.receivedDate && (
                      <span className="block text-xs text-muted-foreground">
                        {formatDateThai(job.receivedDate)}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
