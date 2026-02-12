"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, ChevronDown, Download, ExternalLink } from "lucide-react";
import {
  getDefaultCalendarEvents,
  getGoogleCalendarUrlForDate,
  downloadIcsForEvents,
} from "@/lib/calendar";
import type { CalendarJob } from "@/lib/calendar";

type AddToCalendarButtonProps = {
  job: CalendarJob;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "secondary"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon" | "xs" | "icon-sm" | "icon-xs";
  className?: string;
  iconOnly?: boolean;
};

export function AddToCalendarButton({
  job,
  variant = "outline",
  size = "sm",
  className,
  iconOnly = false,
}: AddToCalendarButtonProps) {
  const t = useTranslations("jobs");
  const events = getDefaultCalendarEvents(job);
  const details = [
    job.payerName && `Payer: ${job.payerName}`,
    job.platforms?.length && `Platforms: ${job.platforms.join(", ")}`,
    job.contentType && `Content type: ${job.contentType}`,
    job.notes && `Notes: ${job.notes}`,
  ]
    .filter((s): s is string => Boolean(s))
    .join("\n");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={iconOnly ? "icon" : size}
          className={className}
          aria-label={t("addToCalendar")}
        >
          <Calendar className="h-4 w-4" />
          {!iconOnly && (
            <>
              {t("addToCalendar")}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex flex-col gap-2">
          {job.reviewDeadline && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() =>
                window.open(
                  getGoogleCalendarUrlForDate({
                    title: `${job.title} (Review deadline)`,
                    date: job.reviewDeadline!,
                    details,
                  }),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {t("googleCalendarReviewDeadline")}
            </Button>
          )}
          {job.publishDate && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() =>
                window.open(
                  getGoogleCalendarUrlForDate({
                    title: `${job.title} (Publish)`,
                    date: job.publishDate!,
                    details,
                  }),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {t("googleCalendarPublishDate")}
            </Button>
          )}
          {(job.reviewDeadline || job.publishDate) && (
            <div className="my-0.5 border-t border-border" role="separator" />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            disabled={events.length === 0}
            onClick={() =>
              downloadIcsForEvents(
                events,
                `job-${job.title.slice(0, 24).replace(/\s/g, "-")}.ics`,
              )
            }
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            {t("appleCalendarDownloadIcs")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
