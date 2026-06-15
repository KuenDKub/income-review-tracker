import { NextResponse } from "next/server";
import { getPortfolioData } from "@/controllers/portfolioController";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getPortfolioData();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/portfolio:", err);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}
