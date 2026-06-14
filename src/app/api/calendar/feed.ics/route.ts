/**
 * Public iCalendar subscription feed (one-way: app -> Apple/Google Calendar).
 *
 * Apple Calendar can't send our session cookie, so this endpoint is NOT behind
 * the session gate — it is authorized by a secret token in the query string
 * (`?token=...`) compared in constant time against CALENDAR_FEED_TOKEN.
 *
 * Note: the middleware matcher in src/proxy.ts skips any path containing a dot,
 * so `/api/calendar/feed.ics` bypasses the cookie auth automatically. The token
 * check below is what actually protects the feed.
 *
 * The feed is read-only and rebuilt from the DB on every request, so calendar
 * apps that re-poll it stay in sync. UIDs are stable per job/note so edits
 * update the existing event instead of creating duplicates.
 */
import { timingSafeEqual } from "crypto";
import { listJobsForFeed } from "@/controllers/jobsController";
import { listAllCalendarNotes } from "@/controllers/calendarNotesController";
import { buildCalendarFeedIcs, type CalendarEvent } from "@/lib/calendar";

// pg + DB access require the Node.js runtime, and the feed must reflect the
// current DB on every poll (never statically cached at build time).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEED_DOMAIN = "income-review-tracker";

function tokenMatches(provided: string | null, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function jobDetails(job: {
  payerName: string | null;
  platforms: string[];
  contentType: string;
  notes: string | null;
}): string {
  return [
    job.payerName && `Payer: ${job.payerName}`,
    job.platforms.length > 0 && `Platforms: ${job.platforms.join(", ")}`,
    job.contentType && `Content type: ${job.contentType}`,
    job.notes && `Notes: ${job.notes}`,
  ]
    .filter((s): s is string => Boolean(s))
    .join("\n");
}

export async function GET(req: Request) {
  const expected = process.env.CALENDAR_FEED_TOKEN ?? "";
  if (!expected) {
    return new Response("Calendar feed is not configured", { status: 404 });
  }
  const token = new URL(req.url).searchParams.get("token");
  if (!tokenMatches(token, expected)) {
    // Don't reveal whether the path exists to unauthenticated callers.
    return new Response("Not found", { status: 404 });
  }

  try {
    const [jobs, notes] = await Promise.all([
      listJobsForFeed(),
      listAllCalendarNotes(),
    ]);

    const events: CalendarEvent[] = [];
    for (const job of jobs) {
      const description = jobDetails(job);
      if (job.reviewDeadline) {
        events.push({
          title: `${job.title} (Review deadline)`,
          date: job.reviewDeadline,
          description,
          uid: `job-${job.id}-review@${FEED_DOMAIN}`,
        });
      }
      if (job.publishDate) {
        events.push({
          title: `${job.title} (Publish)`,
          date: job.publishDate,
          description,
          uid: `job-${job.id}-publish@${FEED_DOMAIN}`,
        });
      }
      if (job.paymentDate) {
        events.push({
          title: `${job.title} (Payment)`,
          date: job.paymentDate,
          description,
          uid: `job-${job.id}-payment@${FEED_DOMAIN}`,
        });
      }
    }
    for (const note of notes) {
      const firstLine = note.text.split("\n")[0]?.trim() || "Note";
      events.push({
        title: firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine,
        date: note.noteDate,
        description: note.text,
        uid: `note-${note.id}@${FEED_DOMAIN}`,
      });
    }

    const ics = buildCalendarFeedIcs(events, {
      calName: "Review Income Tracker",
      refreshHours: 6,
    });

    return new Response(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="income-review-tracker.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("GET /api/calendar/feed.ics:", err);
    return new Response("Failed to build calendar feed", { status: 500 });
  }
}
