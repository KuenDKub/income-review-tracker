/**
 * Portfolio page data. Aggregates real brand collaborations, content gallery
 * (evidence images), headline stats, and the published rate card into one
 * read-only payload for the public-facing portfolio view.
 *
 * Prisma typed API only (no raw SQL).
 */

import { prisma } from "@/lib/db/prisma";
import { getMediaKitStats, listRateCards, type RateCard, type MediaKitStats } from "./rateCardController";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|heic)(\?|$)/i;

export type PortfolioCollab = {
  name: string;
  dealCount: number;
  platforms: string[];
  contentTypes: string[];
  imageUrl: string | null;
};

export type PortfolioWork = {
  id: string;
  imageUrl: string;
  title: string;
  payerName: string | null;
  platforms: string[];
  contentType: string;
};

export type PortfolioData = {
  stats: MediaKitStats;
  rates: RateCard[];
  collaborations: PortfolioCollab[];
  gallery: PortfolioWork[];
  platforms: string[];
};

export async function getPortfolioData(): Promise<PortfolioData> {
  const [stats, allRates, jobs, docs] = await Promise.all([
    getMediaKitStats(),
    listRateCards(),
    prisma.review_jobs.findMany({
      where: {
        is_brother_job: false,
        AND: [{ payer_name: { not: null } }, { payer_name: { not: "" } }],
      },
      select: {
        id: true,
        payer_name: true,
        platforms: true,
        content_type: true,
        publish_date: true,
      },
    }),
    prisma.documents.findMany({
      // Only curated portfolio images — never "evidence" (payment slips), which
      // are private financial documents and must not appear in a portfolio.
      where: { kind: "portfolio", file_path: { not: null }, review_job_id: { not: null } },
      orderBy: { created_at: "desc" },
      take: 40,
      select: {
        id: true,
        file_path: true,
        review_jobs: {
          select: {
            title: true,
            payer_name: true,
            platforms: true,
            content_type: true,
          },
        },
      },
    }),
  ]);

  // Brand -> first (newest) evidence image, for collaboration thumbnails.
  const imageByBrand = new Map<string, string>();

  // Gallery: image documents with their job context.
  const gallery: PortfolioWork[] = [];
  for (const d of docs) {
    if (!d.file_path || !IMAGE_EXT.test(d.file_path) || !d.review_jobs) continue;
    gallery.push({
      id: d.id,
      imageUrl: d.file_path,
      title: d.review_jobs.title,
      payerName: d.review_jobs.payer_name ?? null,
      platforms: Array.isArray(d.review_jobs.platforms) ? d.review_jobs.platforms : [],
      contentType: d.review_jobs.content_type,
    });
    if (d.review_jobs.payer_name && !imageByBrand.has(d.review_jobs.payer_name)) {
      imageByBrand.set(d.review_jobs.payer_name, d.file_path);
    }
  }

  // Collaborations grouped by brand (payer_name).
  const byBrand = new Map<
    string,
    { dealCount: number; platforms: Set<string>; contentTypes: Set<string> }
  >();
  for (const j of jobs) {
    const name = j.payer_name;
    if (!name) continue;
    const entry =
      byBrand.get(name) ?? { dealCount: 0, platforms: new Set(), contentTypes: new Set() };
    entry.dealCount += 1;
    for (const p of j.platforms) entry.platforms.add(p);
    if (j.content_type) entry.contentTypes.add(j.content_type);
    byBrand.set(name, entry);
  }

  const collaborations: PortfolioCollab[] = [...byBrand.entries()]
    .map(([name, e]) => ({
      name,
      dealCount: e.dealCount,
      platforms: [...e.platforms].sort(),
      contentTypes: [...e.contentTypes],
      imageUrl: imageByBrand.get(name) ?? null,
    }))
    .sort((a, b) => b.dealCount - a.dealCount || a.name.localeCompare(b.name));

  const platformSet = new Set<string>();
  for (const w of gallery) for (const p of w.platforms) platformSet.add(p);
  for (const c of collaborations) for (const p of c.platforms) platformSet.add(p);

  return {
    stats,
    rates: allRates.filter((r) => r.isPublished),
    collaborations,
    gallery,
    platforms: [...platformSet].sort(),
  };
}
