import { NextResponse } from "next/server";
import {
  updateCalendarNote,
  deleteCalendarNote,
} from "@/controllers/calendarNotesController";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const text =
      typeof body.text === "string" ? (body.text as string).trim() : undefined;
    const noteDate =
      typeof body.noteDate === "string"
        ? (body.noteDate as string).trim()
        : undefined;

    const next = await updateCalendarNote(id, { text, noteDate });
    if (!next) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: next });
  } catch (err) {
    console.error("PATCH /api/calendar/notes/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update calendar note" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const ok = await deleteCalendarNote(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/calendar/notes/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete calendar note" },
      { status: 500 },
    );
  }
}

