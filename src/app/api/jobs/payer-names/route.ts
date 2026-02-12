import { NextResponse } from "next/server";
import { listPayerNames } from "@/controllers/jobsController";

export async function GET() {
  try {
    const data = await listPayerNames();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/jobs/payer-names:", err);
    return NextResponse.json(
      { error: "Failed to list payer names" },
      { status: 500 }
    );
  }
}
