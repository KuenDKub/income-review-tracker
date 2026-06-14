import { NextResponse } from "next/server";
import { listRateCards, getMediaKitStats } from "@/controllers/rateCardController";
import { buildMediaKitDocxBuffer } from "@/lib/docx/mediaKitWriter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  creatorName?: string;
  handle?: string;
  tagline?: string;
  filename?: string;
  labels?: Record<string, string>;
};

const DEFAULT_LABELS = {
  rateCard: "Rate Card",
  deliverable: "Deliverable",
  platform: "Platform",
  price: "Price",
  notes: "Notes",
  dealsDone: "Deals delivered",
  brands: "Brands worked with",
  onPlatforms: "Platforms",
  since: "Creating content since",
  generatedNote: "Generated with Income & Review Tracker",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const [rates, stats] = await Promise.all([
      listRateCards(),
      getMediaKitStats(),
    ]);

    const labels = { ...DEFAULT_LABELS, ...(body.labels ?? {}) };

    const buffer = await buildMediaKitDocxBuffer({
      creatorName: (body.creatorName ?? "Creator").trim() || "Creator",
      handle: (body.handle ?? "").trim(),
      tagline: body.tagline?.trim() || undefined,
      stats,
      rates: rates
        .filter((r) => r.isPublished)
        .map((r) => ({
          platform: r.platform,
          contentType: r.contentType,
          price: r.price,
          currency: r.currency,
          notes: r.notes,
        })),
      labels,
    });

    const filename = body.filename || "media-kit.docx";
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("POST /api/rate-cards/media-kit:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
