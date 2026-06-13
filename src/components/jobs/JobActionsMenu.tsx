"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarPlus,
  Download,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  getDefaultCalendarEvents,
  getGoogleCalendarUrlForDate,
  downloadIcsForEvents,
} from "@/lib/calendar";
import type { JobItem } from "./JobList";

type JobActionsMenuProps = {
  job: JobItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-left transition-colors hover:bg-muted active:scale-[0.99] " +
        (destructive ? "text-destructive hover:bg-destructive/10" : "")
      }
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );
}

export function JobActionsMenu({ job, onEdit, onDelete }: JobActionsMenuProps) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const calJob = {
    title: job.title,
    platforms: job.platforms,
    contentType: job.contentType,
    payerName: job.payerName,
    reviewDeadline: job.reviewDeadline ?? null,
    publishDate: job.publishDate ?? null,
  };
  const details = [
    job.payerName && `Payer: ${job.payerName}`,
    job.platforms?.length && `Platforms: ${job.platforms.join(", ")}`,
    job.contentType && `Content type: ${job.contentType}`,
  ]
    .filter((s): s is string => Boolean(s))
    .join("\n");
  const events = getDefaultCalendarEvents(calJob);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground"
          aria-label={tCommon("more")}
        >
          <MoreVertical className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1.5">
        <MenuItem
          icon={Eye}
          label={tCommon("view")}
          onClick={() => router.push(`/jobs/${job.id}`)}
        />
        {onEdit && (
          <MenuItem
            icon={Pencil}
            label={tCommon("edit")}
            onClick={() => onEdit(job.id)}
          />
        )}

        {(job.reviewDeadline || job.publishDate || events.length > 0) && (
          <div className="my-1 border-t" role="separator" />
        )}
        {job.reviewDeadline && (
          <MenuItem
            icon={CalendarPlus}
            label={t("googleCalendarReviewDeadline")}
            onClick={() =>
              window.open(
                getGoogleCalendarUrlForDate({
                  title: `${job.title} (Review deadline)`,
                  date: job.reviewDeadline!,
                  details,
                }),
                "_blank",
                "noopener,noreferrer"
              )
            }
          />
        )}
        {job.publishDate && (
          <MenuItem
            icon={CalendarPlus}
            label={t("googleCalendarPublishDate")}
            onClick={() =>
              window.open(
                getGoogleCalendarUrlForDate({
                  title: `${job.title} (Publish)`,
                  date: job.publishDate!,
                  details,
                }),
                "_blank",
                "noopener,noreferrer"
              )
            }
          />
        )}
        {events.length > 0 && (
          <MenuItem
            icon={Download}
            label={t("appleCalendarDownloadIcs")}
            onClick={() =>
              downloadIcsForEvents(
                events,
                `job-${job.title.slice(0, 24).replace(/\s/g, "-")}.ics`
              )
            }
          />
        )}

        {onDelete && (
          <>
            <div className="my-1 border-t" role="separator" />
            <MenuItem
              icon={Trash2}
              label={tCommon("delete")}
              onClick={() => onDelete(job.id)}
              destructive
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
