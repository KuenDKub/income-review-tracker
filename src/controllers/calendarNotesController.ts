import { prisma } from "@/lib/db/prisma";
import type { CalendarNote } from "@/types/calendarNotes";

type CalendarNoteRow = {
  id: string;
  note_date: Date;
  review_job_id: string | null;
  text: string;
  created_at: Date;
  updated_at: Date;
};

function serialize(row: CalendarNoteRow): CalendarNote {
  return {
    id: row.id,
    // note_date is a DATE column; emit it as yyyy-MM-dd (UTC-stable, no TZ shift).
    noteDate: row.note_date.toISOString().slice(0, 10),
    reviewJobId: row.review_job_id,
    text: row.text,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listCalendarNotesInRange(opts: {
  from: string;
  to: string;
}): Promise<CalendarNote[]> {
  const { from, to } = opts;
  const rows = await prisma.calendar_notes.findMany({
    where: { note_date: { gte: new Date(from), lte: new Date(to) } },
    orderBy: [{ note_date: "asc" }, { created_at: "asc" }],
  });
  return rows.map(serialize);
}

/** All calendar notes, for the .ics subscription feed. Read-only. */
export async function listAllCalendarNotes(): Promise<CalendarNote[]> {
  const rows = await prisma.calendar_notes.findMany({
    orderBy: [{ note_date: "asc" }, { created_at: "asc" }],
  });
  return rows.map(serialize);
}

export async function createCalendarNote(input: {
  noteDate: string;
  text: string;
  reviewJobId?: string | null;
}): Promise<CalendarNote> {
  const { noteDate, text, reviewJobId = null } = input;
  const row = await prisma.calendar_notes.create({
    data: {
      note_date: new Date(noteDate),
      review_job_id: reviewJobId,
      text,
    },
  });
  return serialize(row);
}

export async function updateCalendarNote(
  id: string,
  input: { text?: string; noteDate?: string; reviewJobId?: string | null },
): Promise<CalendarNote | null> {
  const existing = await prisma.calendar_notes.findUnique({ where: { id } });
  if (!existing) return null;

  const row = await prisma.calendar_notes.update({
    where: { id },
    data: {
      note_date: input.noteDate ? new Date(input.noteDate) : existing.note_date,
      review_job_id:
        input.reviewJobId === undefined ? existing.review_job_id : input.reviewJobId,
      text: input.text ?? existing.text,
      updated_at: new Date(),
    },
  });
  return serialize(row);
}

export async function deleteCalendarNote(id: string): Promise<boolean> {
  const res = await prisma.calendar_notes.deleteMany({ where: { id } });
  return res.count > 0;
}
