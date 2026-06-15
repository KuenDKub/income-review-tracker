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
  // Parse and mutate in UTC so the result is independent of the server's
  // timezone (parsing as local time + toISOString() would roll the date back
  // a day in positive-offset zones like UTC+7).
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type CalendarEvent = {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  uid?: string;
  /**
   * Optional display reminder. `trigger` is an iCalendar duration relative to
   * DTSTART (event midnight). For an all-day event, "PT9H" fires at 9am on the
   * day; "-P1D" fires the day before. When set, a VALARM is emitted so Apple /
   * Google Calendar shows a native notification.
   */
  alarm?: { trigger: string; description?: string };
};

/** UTC timestamp in iCalendar form: yyyymmddThhmmssZ. */
function icsTimestamp(d = new Date()): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Fold a content line to <=75 octets per RFC 5545. We fold on JS code-unit
 * boundaries (not bytes) so multibyte text (e.g. Thai) is reconstructed exactly
 * when the client unfolds. Continuation lines start with a single space.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) {
    parts.push(" " + line.slice(i, i + 74));
  }
  return parts.join("\r\n");
}

/** Build a VEVENT block. `dtstamp` is required for feeds (RFC 5545). */
function buildVevent(ev: CalendarEvent, dtstamp?: string): string {
  const start = yyyymmdd(ev.date);
  const end = yyyymmdd(addDays(ev.date, 1)); // DTEND is exclusive for all-day events
  const summary = escapeIcs(ev.title);
  const description = ev.description ? escapeIcs(ev.description) : "";
  const uid = escapeIcs(ev.uid ?? `${start}-${ev.title}`.slice(0, 200));
  const alarmLines = ev.alarm
    ? [
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `TRIGGER:${ev.alarm.trigger}`,
        `DESCRIPTION:${escapeIcs(ev.alarm.description ?? ev.title)}`,
        "END:VALARM",
      ]
    : [];
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    dtstamp ? `DTSTAMP:${dtstamp}` : "",
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : "",
    ...alarmLines,
    "END:VEVENT",
  ]
    .filter(Boolean)
    .map(foldLine)
    .join("\r\n");
}

export function getIcsBlobForEvents(events: CalendarEvent[]): Blob {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Review Income Tracker//EN",
    ...events.map((ev) => buildVevent(ev)),
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Blob([ics], { type: "text/calendar;charset=utf-8" });
}

/**
 * Build a full iCalendar subscription feed (string) for serving from an HTTP
 * endpoint. Includes a calendar name and refresh hints so clients like Apple
 * Calendar know how often to re-poll. UIDs should be stable per event so edits
 * update the existing entry instead of creating a duplicate.
 */
export function buildCalendarFeedIcs(
  events: CalendarEvent[],
  opts: { calName: string; refreshHours?: number },
): string {
  const dtstamp = icsTimestamp();
  const ttl = `PT${Math.max(1, Math.round(opts.refreshHours ?? 6))}H`;
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Review Income Tracker//Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(opts.calName)}`,
    `NAME:${escapeIcs(opts.calName)}`,
    `REFRESH-INTERVAL;VALUE=DURATION:${ttl}`,
    `X-PUBLISHED-TTL:${ttl}`,
  ].map(foldLine);

  return [
    ...header,
    ...events.map((ev) => buildVevent(ev, dtstamp)),
    "END:VCALENDAR",
  ].join("\r\n");
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
      // Remind at 9am on the publish day to post the content.
      alarm: { trigger: "PT9H", description: `Post: ${job.title}` },
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
