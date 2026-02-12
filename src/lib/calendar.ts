/**
 * Utilities for adding review jobs to calendar (Google Calendar, Apple iCal).
 */

export type CalendarJob = {
  title: string;
  platforms?: string[];
  contentType?: string;
  payerName?: string | null;
  notes?: string | null;
  reviewDeadline?: string | null; // YYYY-MM-DD
  publishDate?: string | null; // YYYY-MM-DD
};

function formatDateForGoogle(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15);
}

function buildDetails(job: CalendarJob): string {
  return [
    job.payerName && `Payer: ${job.payerName}`,
    job.platforms?.length && `Platforms: ${job.platforms.join(", ")}`,
    job.contentType && `Content type: ${job.contentType}`,
    job.notes && `Notes: ${job.notes}`,
  ]
    .filter((s): s is string => Boolean(s))
    .join("\n");
}

export function getGoogleCalendarUrlForDate(opts: {
  title: string;
  date: string; // YYYY-MM-DD
  details?: string;
}): string {
  const start = formatDateForGoogle(opts.date);
  const end = start;
  const text = encodeURIComponent(opts.title);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text,
    dates: `${start}/${end}`,
    details: opts.details ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function yyyymmdd(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type CalendarEvent = {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  uid?: string;
};

export function getIcsBlobForEvents(events: CalendarEvent[]): Blob {
  const vevents = events.map((ev) => {
    const start = yyyymmdd(ev.date);
    const end = yyyymmdd(addDays(ev.date, 1)); // DTEND is exclusive for all-day events
    const summary = escapeIcs(ev.title);
    const description = ev.description ? escapeIcs(ev.description) : "";
    const uid = escapeIcs(ev.uid ?? `${start}-${ev.title}`.slice(0, 200));
    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : "",
      "END:VEVENT",
    ]
      .filter(Boolean)
      .join("\r\n");
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Review Income Tracker//EN",
    ...vevents,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Blob([ics], { type: "text/calendar;charset=utf-8" });
}

export function getDefaultCalendarEvents(job: CalendarJob): CalendarEvent[] {
  const details = buildDetails(job);
  const events: CalendarEvent[] = [];
  if (job.reviewDeadline) {
    events.push({
      title: `${job.title} (Review deadline)`,
      date: job.reviewDeadline,
      description: details,
      uid: `review-deadline-${job.reviewDeadline}-${job.title}`,
    });
  }
  if (job.publishDate) {
    events.push({
      title: `${job.title} (Publish)`,
      date: job.publishDate,
      description: details,
      uid: `publish-${job.publishDate}-${job.title}`,
    });
  }
  return events;
}

export function downloadIcsForEvents(events: CalendarEvent[], filename = "event.ics"): void {
  const blob = getIcsBlobForEvents(events);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
