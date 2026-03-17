import { NextResponse } from "next/server";
import {
  listCalendarNotesInRange,
  createCalendarNote,
} from "@/controllers/calendarNotesController";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to query params are required" },
        { status: 400 },
      );
    }
    if (
      !DATE_REGEX.test(from) ||
      !DATE_REGEX.test(to) ||
      Number.isNaN(Date.parse(from)) ||
      Number.isNaN(Date.parse(to))
    ) {
      return NextResponse.json(
        { error: "from and to must be valid dates in yyyy-MM-dd format" },
        { status: 400 },
      );
    }
    const notes = await listCalendarNotesInRange({ from, to });
    return NextResponse.json({ data: notes });
  } catch (err) {
    console.error("GET /api/calendar/notes:", err);
    return NextResponse.json(
      { error: "Failed to fetch calendar notes" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const noteDate = String(body.noteDate ?? "").trim();
    const text = String(body.text ?? "").trim();
    const reviewJobIdRaw = body.reviewJobId;
    const reviewJobId =
      typeof reviewJobIdRaw === "string" && reviewJobIdRaw.trim().length > 0
        ? reviewJobIdRaw.trim()
        : null;

    if (!noteDate || !text) {
      return NextResponse.json(
        { error: "noteDate and text are required" },
        { status: 400 },
      );
    }

    if (
      !DATE_REGEX.test(noteDate) ||
      Number.isNaN(Date.parse(noteDate))
    ) {
      return NextResponse.json(
        { error: "noteDate must be a valid date in yyyy-MM-dd format" },
        { status: 400 },
      );
    }

    if (reviewJobId !== null && !UUID_REGEX.test(reviewJobId)) {
      return NextResponse.json(
        { error: "reviewJobId must be a valid UUID when provided" },
        { status: 400 },
      );
    }

    const note = await createCalendarNote({ noteDate, text, reviewJobId });
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    console.error("POST /api/calendar/notes:", err);
    return NextResponse.json(
      { error: "Failed to create calendar note" },
      { status: 500 },
    );
  }
}

