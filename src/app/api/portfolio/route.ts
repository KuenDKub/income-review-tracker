import { NextRequest, NextResponse } from "next/server";
import {
  getPortfolioData,
  setBrandPortfolioVisibility,
} from "@/controllers/portfolioController";

export const dynamic = "force-dynamic";

// This route is auth-gated by proxy.ts, so `includeHidden` (which exposes brands
// the owner has hidden) is only reachable by the logged-in owner.
export async function GET(request: NextRequest) {
  try {
    const includeHidden =
      request.nextUrl.searchParams.get("includeHidden") === "1";
    const data = await getPortfolioData({ includeHidden });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/portfolio:", err);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}

/** Toggle a brand's visibility on the public portfolio. Owner-only (auth-gated). */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const payerName = typeof body?.payerName === "string" ? body.payerName : "";
    const showOnPortfolio = body?.showOnPortfolio;
    if (!payerName || typeof showOnPortfolio !== "boolean") {
      return NextResponse.json(
        { error: "payerName (string) and showOnPortfolio (boolean) are required" },
        { status: 400 },
      );
    }
    const updated = await setBrandPortfolioVisibility(payerName, showOnPortfolio);
    return NextResponse.json({ data: { updated } });
  } catch (err) {
    console.error("PATCH /api/portfolio:", err);
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
  }
}
