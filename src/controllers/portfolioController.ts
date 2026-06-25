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
  /** Whether this brand currently appears on the public portfolio. */
  showOnPortfolio: boolean;
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

/**
 * @param opts.includeHidden Owner-only (the edit page): include brands/jobs whose
 *   `show_on_portfolio` is false, so the owner can see and re-enable them. The
 *   public page must NEVER pass this. The `/api/portfolio` route that exposes it
 *   is auth-gated by proxy.ts.
 */
export async function getPortfolioData(
  opts?: { includeHidden?: boolean },
): Promise<PortfolioData> {
  const includeHidden = opts?.includeHidden ?? false;
  const [stats, allRates, jobs, docs] = await Promise.all([
    getMediaKitStats(),
    listRateCards(),
    prisma.review_jobs.findMany({
      where: {
        is_brother_job: false,
        ...(includeHidden ? {} : { show_on_portfolio: true }),
        AND: [{ payer_name: { not: null } }, { payer_name: { not: "" } }],
      },
      select: {
        id: true,
        payer_name: true,
        platforms: true,
        content_type: true,
        publish_date: true,
        show_on_portfolio: true,
      },
    }),
    prisma.documents.findMany({
      // Only curated portfolio images — never "evidence" (payment slips), which
      // are private financial documents and must not appear in a portfolio.
      // Also gated by the job's per-job consent flag (NDA protection).
      where: {
        kind: "portfolio",
        file_path: { not: null },
        review_job_id: { not: null },
        ...(includeHidden ? {} : { review_jobs: { is: { show_on_portfolio: true } } }),
      },
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

  // Collaborations grouped by brand (payer_name). `anyShown` drives the brand's
  // public visibility toggle on the edit page (a brand shows if any of its jobs
  // is visible). In the default (public) query every job already passed the
  // show_on_portfolio filter, so this is always true there.
  const byBrand = new Map<
    string,
    { dealCount: number; platforms: Set<string>; contentTypes: Set<string>; anyShown: boolean }
  >();
  for (const j of jobs) {
    const name = j.payer_name;
    if (!name) continue;
    const entry =
      byBrand.get(name) ??
      { dealCount: 0, platforms: new Set(), contentTypes: new Set(), anyShown: false };
    entry.dealCount += 1;
    for (const p of j.platforms) entry.platforms.add(p);
    if (j.content_type) entry.contentTypes.add(j.content_type);
    if (j.show_on_portfolio) entry.anyShown = true;
    byBrand.set(name, entry);
  }

  const collaborations: PortfolioCollab[] = [...byBrand.entries()]
    .map(([name, e]) => ({
      name,
      dealCount: e.dealCount,
      platforms: [...e.platforms].sort(),
      contentTypes: [...e.contentTypes],
      imageUrl: imageByBrand.get(name) ?? null,
      showOnPortfolio: e.anyShown,
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

/**
 * Show/hide a whole brand on the public portfolio by setting `show_on_portfolio`
 * on every (non-brother) job under that payer name. Owner-only; the route is
 * auth-gated. Returns the number of jobs updated.
 */
export async function setBrandPortfolioVisibility(
  payerName: string,
  show: boolean,
): Promise<number> {
  const name = payerName.trim();
  if (!name) return 0;
  const res = await prisma.review_jobs.updateMany({
    where: { payer_name: name, is_brother_job: false },
    data: { show_on_portfolio: show },
  });
  return res.count;
}
