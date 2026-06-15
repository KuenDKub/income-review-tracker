import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/controllers/profileController";
import { getPortfolioData } from "@/controllers/portfolioController";
import { listRateCards, getMediaKitStats } from "@/controllers/rateCardController";
import { buildMediaKitDocxBuffer } from "@/lib/docx/mediaKitWriter";
import { loadImageForDocx } from "@/lib/docx/loadImage";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public media-kit download for the shared portfolio. Builds the .docx from the
 * stored creator profile + published rates + stats. Exempted from the auth gate
 * in proxy.ts (it only exposes already-public portfolio data).
 */
export async function GET(request: NextRequest) {
  try {
    const localeParam = request.nextUrl.searchParams.get("locale");
    const locale = routing.locales.includes(localeParam as never)
      ? (localeParam as string)
      : routing.defaultLocale;

    const [profile, portfolio, rates, stats, tRate] = await Promise.all([
      getProfile(),
      getPortfolioData(),
      listRateCards(),
      getMediaKitStats(),
      getTranslations({ locale, namespace: "rateCard" }),
    ]);

    if (!profile.isPublic) {
      return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    const handle = profile.handle ? `@${profile.handle.replace(/^@/, "")}` : "";
    const avatar = await loadImageForDocx(profile.avatarUrl, request.nextUrl.origin);

    const buffer = await buildMediaKitDocxBuffer({
      creatorName: profile.creatorName || profile.handle || "Creator",
      handle,
      tagline: profile.tagline || undefined,
      avatar,
      stats,
      collaborations: portfolio.collaborations.map((c) => ({
        name: c.name,
        dealCount: c.dealCount,
      })),
      rates: rates
        .filter((r) => r.isPublished)
        .map((r) => ({
          platform: r.platform,
          contentType: r.contentType,
          price: r.price,
          currency: r.currency,
          notes: r.notes,
        })),
      labels: {
        rateCard: tRate("mediaKitRateCard"),
        deliverable: tRate("colDeliverable"),
        platform: tRate("colPlatform"),
        price: tRate("colPrice"),
        notes: tRate("colNotes"),
        dealsDone: tRate("statDeals"),
        brands: tRate("statBrands"),
        onPlatforms: tRate("statPlatforms"),
        since: tRate("since"),
        generatedNote: tRate("generatedNote"),
      },
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="media-kit.docx"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("GET /api/portfolio/media-kit:", err);
    return NextResponse.json({ error: "Failed to generate media kit" }, { status: 500 });
  }
}
