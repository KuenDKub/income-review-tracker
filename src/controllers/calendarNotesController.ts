import { query } from "@/lib/db/client";
import type { CalendarNote } from "@/types/calendarNotes";

export type CalendarNoteRow = {
  id: string;
  note_date: string;
  review_job_id: string | null;
  text: string;
  created_at: string;
  updated_at: string;
};

function serialize(row: CalendarNoteRow): CalendarNote {
  return {
    id: row.id,
    noteDate: row.note_date,
    reviewJobId: row.review_job_id,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCalendarNotesInRange(opts: {
  from: string;
  to: string;
}): Promise<CalendarNote[]> {
  const { from, to } = opts;
  const { rows } = await query<CalendarNoteRow>(
    `SELECT * FROM calendar_notes
     WHERE note_date BETWEEN $1::date AND $2::date
     ORDER BY note_date ASC, created_at ASC`,
    [from, to],
  );
  return rows.map(serialize);
}

/** All calendar notes, for the .ics subscription feed. Read-only. */
export async function listAllCalendarNotes(): Promise<CalendarNote[]> {
  const { rows } = await query<CalendarNoteRow>(
    `SELECT * FROM calendar_notes ORDER BY note_date ASC, created_at ASC`,
  );
  return rows.map(serialize);
}

export async function createCalendarNote(input: {
  noteDate: string;
  text: string;
  reviewJobId?: string | null;
}): Promise<CalendarNote> {
  const { noteDate, text, reviewJobId = null } = input;
  const { rows } = await query<CalendarNoteRow>(
    `INSERT INTO calendar_notes (note_date, review_job_id, text)
     VALUES ($1::date, $2::uuid, $3)
     RETURNING *`,
    [noteDate, reviewJobId, text],
  );
  return serialize(rows[0]);
}

export async function updateCalendarNote(
  id: string,
  input: { text?: string; noteDate?: string; reviewJobId?: string | null },
): Promise<CalendarNote | null> {
  const existingRes = await query<CalendarNoteRow>(
    "SELECT * FROM calendar_notes WHERE id = $1",
    [id],
  );
  if (existingRes.rows.length === 0) return null;
  const existing = existingRes.rows[0];

  const nextText = input.text ?? existing.text;
  const nextDate = input.noteDate ?? existing.note_date;
  const nextReviewJobId =
    input.reviewJobId === undefined ? existing.review_job_id : input.reviewJobId;

  const { rows } = await query<CalendarNoteRow>(
    `UPDATE calendar_notes
     SET note_date = $1::date,
         review_job_id = $2::uuid,
         text = $3,
         updated_at = now()
     WHERE id = $4
     RETURNING *`,
    [nextDate, nextReviewJobId, nextText, id],
  );
  if (rows.length === 0) return null;
  return serialize(rows[0]);
}

export async function deleteCalendarNote(id: string): Promise<boolean> {
  const res = await query("DELETE FROM calendar_notes WHERE id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}

