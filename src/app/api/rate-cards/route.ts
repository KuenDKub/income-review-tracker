import { NextRequest, NextResponse } from "next/server";
import {
  listRateCards,
  getRateSuggestions,
  getMediaKitStats,
  saveRateCards,
} from "@/controllers/rateCardController";
import { rateCardsSaveSchema } from "@/lib/schemas/rateCard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rateCards, suggestions, stats] = await Promise.all([
      listRateCards(),
      getRateSuggestions(),
      getMediaKitStats(),
    ]);
    return NextResponse.json({ data: { rateCards, suggestions, stats } });
  } catch (err) {
    console.error("GET /api/rate-cards:", err);
    return NextResponse.json({ error: "Failed to load rate cards" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = rateCardsSaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const rateCards = await saveRateCards(parsed.data.rows);
    return NextResponse.json({ data: { rateCards } });
  } catch (err) {
    console.error("PUT /api/rate-cards:", err);
    return NextResponse.json({ error: "Failed to save rate cards" }, { status: 500 });
  }
}
