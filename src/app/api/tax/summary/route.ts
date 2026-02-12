import { NextResponse } from "next/server";
import { getTaxSummary } from "@/controllers/taxController";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(
    searchParams.get("year") ?? String(new Date().getFullYear()),
    10
  );

  try {
    const data = await getTaxSummary(year);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/tax/summary:", err);
    return NextResponse.json(
      {
        error: "Failed to compute tax summary",
      },
      { status: 500 }
    );
  }
}
