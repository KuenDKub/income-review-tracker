/**
 * Review jobs API business logic. Route handlers parse request, validate with Zod, call here, serialize response.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  serializeReviewJob,
  deserializeReviewJobBody,
  type ReviewJobJson,
} from "@/lib/serializers/reviewJobSerializer";
import type { PaginatedResult } from "@/lib/pagination";

// Row shape returned by the typed review_jobs queries below.
type JobRow = Prisma.review_jobsGetPayload<object>;

/** UTC day-number of COALESCE(received_date, created_at) — matches the SQL `::date` ordering on Vercel (UTC). */
function coalescedDay(job: JobRow): number {
  const d = job.received_date ?? job.created_at;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Sort by COALESCE(received_date, created_at)::date DESC, then created_at DESC. */
function byReceivedThenCreatedDesc(a: JobRow, b: JobRow): number {
  return coalescedDay(b) - coalescedDay(a) || b.created_at.getTime() - a.created_at.getTime();
}

export async function listJobs(opts?: {
  page?: number;
  pageSize?: number;
  maxPageSize?: number;
  search?: string;
  payerName?: string;
  platform?: string;
  contentType?: string;
  status?: string;
  months?: number;
  /** When both set, return jobs that have at least one of review_deadline, publish_date, payment_date in [calendarFrom, calendarTo] (inclusive). */
  calendarFrom?: string;
  calendarTo?: string;
}): Promise<PaginatedResult<ReviewJobJson>> {
  const page = Math.max(1, opts?.page ?? 1);
  const maxPageSize = opts?.maxPageSize ?? 100;
  const pageSize = Math.min(maxPageSize, Math.max(1, opts?.pageSize ?? 10));

  const search = (opts?.search ?? "").trim().toLowerCase();
  const payerName = (opts?.payerName ?? "").trim();
  const platform = (opts?.platform ?? "").trim();
  const contentType = (opts?.contentType ?? "").trim();
  const status = (opts?.status ?? "").trim();
  const months = opts?.months;
  const calendarFrom = opts?.calendarFrom?.trim();
  const calendarTo = opts?.calendarTo?.trim();

  // Filters Prisma can express go in the typed WHERE.
  const where: Prisma.review_jobsWhereInput = {};
  if (status) where.status = status;
  if (payerName) where.payer_name = { contains: payerName, mode: "insensitive" };
  if (platform) where.platforms = { has: platform };
  if (contentType) where.content_type = contentType;
  if (calendarFrom && calendarTo) {
    const range = { gte: new Date(calendarFrom), lte: new Date(calendarTo) };
    where.OR = [
      { review_deadline: range },
      { publish_date: range },
      { payment_date: range },
    ];
  }

  let rows = await prisma.review_jobs.findMany({ where });

  // Free-text search matches title / any platform / content_type, partial & case-insensitive.
  if (search) {
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(search) ||
        r.platforms.some((p) => p.toLowerCase().includes(search)) ||
        r.content_type.toLowerCase().includes(search),
    );
  }

  // "last N months" by COALESCE(received_date, created_at)::date.
  if (typeof months === "number" && Number.isFinite(months) && months > 0) {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(end);
    start.setMonth(start.getMonth() - months);
    const startDay = Date.UTC(
      Number(start.toISOString().slice(0, 4)),
      Number(start.toISOString().slice(5, 7)) - 1,
      Number(start.toISOString().slice(8, 10)),
    );
    rows = rows.filter((r) => coalescedDay(r) >= startDay);
  }

  rows.sort(byReceivedThenCreatedDesc);

  const total = rows.length;
  const pageRows = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const jobIds = pageRows.map((r) => r.id);
  const incomeByJob = new Map<
    string,
    { gross: number; withholding: number; net: number; rate: number | null }
  >();
  if (jobIds.length > 0) {
    const grouped = await prisma.income.groupBy({
      by: ["review_job_id"],
      where: { review_job_id: { in: jobIds } },
      _sum: { gross_amount: true, withholding_amount: true, net_amount: true },
    });
    for (const g of grouped) {
      const gross = Number(g._sum.gross_amount ?? 0);
      const withholding = Number(g._sum.withholding_amount ?? 0);
      const net = Number(g._sum.net_amount ?? 0);
      const rate =
        gross > 0 ? Math.round((withholding / gross) * 100 * 100) / 100 : null;
      if (gross > 0) {
        incomeByJob.set(g.review_job_id, { gross, withholding, net, rate });
      }
    }
  }

  return {
    data: pageRows.map((row) => {
      const job = serializeReviewJob(row);
      const income = incomeByJob.get(row.id);
      return {
        ...job,
        grossAmount: income?.gross ?? null,
        withholdingAmount: income?.withholding ?? null,
        netAmount: income?.net ?? null,
        withholdingRate: income?.rate ?? null,
      };
    }),
    total,
    page,
    pageSize,
  };
}

/**
 * All jobs that have at least one calendar-relevant date, for the .ics
 * subscription feed. Read-only; returns the full set (data volume is small).
 */
export async function listJobsForFeed(): Promise<ReviewJobJson[]> {
  const rows = await prisma.review_jobs.findMany({
    where: {
      OR: [
        { review_deadline: { not: null } },
        { publish_date: { not: null } },
        { payment_date: { not: null } },
      ],
    },
  });
  // ORDER BY COALESCE(review_deadline, publish_date, payment_date) ASC
  const key = (j: JobRow) =>
    (j.review_deadline ?? j.publish_date ?? j.payment_date)?.getTime() ?? 0;
  rows.sort((a, b) => key(a) - key(b));
  return rows.map(serializeReviewJob);
}

export type UpcomingPostItem = {
  id: string;
  title: string;
  payerName: string | null;
  status: string;
  platforms: string[];
  publishDate: string;
  /** Whole days from today; negative = overdue, 0 = today. */
  daysUntil: number;
};

/**
 * Jobs with a publish date in [today - overdueDays, today + windowDays] that
 * aren't paid yet — i.e. content that should be posted soon (or is overdue).
 * Powers the dashboard "upcoming posts" reminder strip.
 */
export async function listUpcomingPosts(opts?: {
  windowDays?: number;
  overdueDays?: number;
}): Promise<UpcomingPostItem[]> {
  const windowDays = opts?.windowDays ?? 14;
  const overdueDays = opts?.overdueDays ?? 7;
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const from = new Date(todayMs - overdueDays * 86_400_000);
  const to = new Date(todayMs + windowDays * 86_400_000);

  const rows = await prisma.review_jobs.findMany({
    where: {
      status: { not: "paid" },
      publish_date: { not: null, gte: from, lte: to },
    },
    select: {
      id: true,
      title: true,
      payer_name: true,
      status: true,
      platforms: true,
      publish_date: true,
    },
  });

  const items = rows
    .filter((r) => r.publish_date != null)
    .map((r) => {
      const d = r.publish_date!;
      const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      return {
        id: r.id,
        title: r.title,
        payerName: r.payer_name ?? null,
        status: r.status,
        platforms: Array.isArray(r.platforms) ? r.platforms : [],
        publishDate: d.toISOString().slice(0, 10),
        daysUntil: Math.round((day - todayMs) / 86_400_000),
      };
    });

  items.sort((a, b) => a.daysUntil - b.daysUntil);
  return items;
}

export async function listPayerNames(): Promise<string[]> {
  const rows = await prisma.review_jobs.findMany({
    where: { AND: [{ payer_name: { not: null } }, { payer_name: { not: "" } }] },
    distinct: ["payer_name"],
    select: { payer_name: true },
    orderBy: { payer_name: "asc" },
  });
  return rows.map((r) => r.payer_name).filter((n): n is string => n != null);
}

export async function getJobById(id: string): Promise<ReviewJobJson | null> {
  const row = await prisma.review_jobs.findUnique({ where: { id } });
  return row ? serializeReviewJob(row) : null;
}

export async function createJob(body: {
  payerName: string;
  status: string;
  platforms: string[];
  contentType: string;
  title: string;
  receivedDate?: string | null;
  reviewDeadline?: string | null;
  publishDate?: string | null;
  paymentDate?: string | null;
  tags?: string[];
  notes?: string | null;
  brief?: string | null;
  briefLink?: string | null;
  briefLinkNote?: string | null;
  isBrotherJob?: boolean;
  showOnPortfolio?: boolean;
}): Promise<ReviewJobJson> {
  const data = deserializeReviewJobBody(body);
  const row = await prisma.review_jobs.create({
    data: {
      payer_name: data.payer_name,
      status: data.status,
      platforms: data.platforms,
      content_type: data.content_type,
      title: data.title,
      received_date: data.received_date ? new Date(data.received_date) : null,
      review_deadline: data.review_deadline ? new Date(data.review_deadline) : null,
      publish_date: data.publish_date ? new Date(data.publish_date) : null,
      payment_date: data.payment_date ? new Date(data.payment_date) : null,
      tags: data.tags,
      notes: data.notes,
      brief: data.brief,
      brief_link: data.brief_link,
      brief_link_note: data.brief_link_note,
      is_brother_job: data.is_brother_job,
      show_on_portfolio: data.show_on_portfolio,
    },
  });
  return serializeReviewJob(row);
}

export async function updateJob(
  id: string,
  body: Partial<{
    payerName: string;
    status: string;
    platforms: string[];
    contentType: string;
    title: string;
    receivedDate: string | null;
    reviewDeadline: string | null;
    publishDate: string | null;
    paymentDate: string | null;
    tags: string[];
    notes: string | null;
    brief: string | null;
    briefLink: string | null;
    briefLinkNote: string | null;
    isBrotherJob: boolean;
    showOnPortfolio: boolean;
  }>,
): Promise<ReviewJobJson | null> {
  const existing = await getJobById(id);
  if (!existing) return null;

  const has = (key: keyof typeof body) =>
    Object.prototype.hasOwnProperty.call(body, key);

  const data = deserializeReviewJobBody({
    payerName: has("payerName")
      ? (body.payerName ?? "")
      : (existing.payerName ?? ""),
    status: has("status") ? (body.status ?? existing.status) : existing.status,
    platforms: has("platforms")
      ? (body.platforms ?? existing.platforms)
      : existing.platforms,
    contentType: has("contentType")
      ? (body.contentType ?? existing.contentType)
      : existing.contentType,
    title: has("title") ? (body.title ?? existing.title) : existing.title,
    receivedDate: has("receivedDate")
      ? (body.receivedDate ?? null)
      : (existing.receivedDate ?? null),
    reviewDeadline: has("reviewDeadline")
      ? (body.reviewDeadline ?? null)
      : (existing.reviewDeadline ?? null),
    publishDate: has("publishDate")
      ? (body.publishDate ?? null)
      : (existing.publishDate ?? null),
    paymentDate: has("paymentDate")
      ? (body.paymentDate ?? null)
      : (existing.paymentDate ?? null),
    tags: has("tags") ? (body.tags ?? existing.tags) : existing.tags,
    notes: has("notes") ? (body.notes ?? existing.notes) : existing.notes,
    brief: has("brief") ? (body.brief ?? existing.brief) : existing.brief,
    briefLink: has("briefLink")
      ? (body.briefLink ?? existing.briefLink)
      : existing.briefLink,
    briefLinkNote: has("briefLinkNote")
      ? (body.briefLinkNote ?? existing.briefLinkNote)
      : existing.briefLinkNote,
    isBrotherJob: has("isBrotherJob")
      ? (body.isBrotherJob ?? false)
      : (existing.isBrotherJob ?? false),
    showOnPortfolio: has("showOnPortfolio")
      ? (body.showOnPortfolio ?? true)
      : existing.showOnPortfolio,
  });
  const row = await prisma.review_jobs.update({
    where: { id },
    data: {
      payer_name: data.payer_name,
      status: data.status,
      platforms: data.platforms,
      content_type: data.content_type,
      title: data.title,
      received_date: data.received_date ? new Date(data.received_date) : null,
      review_deadline: data.review_deadline ? new Date(data.review_deadline) : null,
      publish_date: data.publish_date ? new Date(data.publish_date) : null,
      payment_date: data.payment_date ? new Date(data.payment_date) : null,
      tags: data.tags,
      notes: data.notes,
      brief: data.brief,
      brief_link: data.brief_link,
      brief_link_note: data.brief_link_note,
      is_brother_job: data.is_brother_job,
      show_on_portfolio: data.show_on_portfolio,
    },
  });
  return serializeReviewJob(row);
}

export async function deleteJob(id: string): Promise<boolean> {
  const res = await prisma.review_jobs.deleteMany({ where: { id } });
  return res.count > 0;
}

/** List recent jobs (e.g. last 10) for dashboard */
export async function listRecentJobs(limit = 10): Promise<ReviewJobJson[]> {
  const rows = await prisma.review_jobs.findMany();
  rows.sort(byReceivedThenCreatedDesc);
  return rows.slice(0, limit).map(serializeReviewJob);
}

/** Top platform by job count (one job can count once per platform it lists). */
export async function getTopPlatformByJobCount(): Promise<{
  name: string;
  count: number;
} | null> {
  const rows = await prisma.review_jobs.findMany({
    where: { NOT: { platforms: { isEmpty: true } } },
    select: { platforms: true },
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const p of r.platforms) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  let top: { name: string; count: number } | null = null;
  for (const [name, count] of counts) {
    if (!top || count > top.count) top = { name, count };
  }
  return top;
}

/** Top payer by job count. */
export async function getTopPayerByJobCount(): Promise<{
  name: string;
  count: number;
} | null> {
  const grouped = await prisma.review_jobs.groupBy({
    by: ["payer_name"],
    where: { AND: [{ payer_name: { not: null } }, { payer_name: { not: "" } }] },
    _count: { payer_name: true },
    orderBy: { _count: { payer_name: "desc" } },
    take: 1,
  });
  const top = grouped[0];
  if (!top || top.payer_name == null) return null;
  return { name: top.payer_name, count: top._count.payer_name };
}

/** Top month by job count (by received_date). */
export async function getTopMonthByJobCount(): Promise<{
  year: number;
  month: number;
  count: number;
} | null> {
  const rows = await prisma.review_jobs.findMany({
    where: { received_date: { not: null } },
    select: { received_date: true },
  });
  const counts = new Map<string, { year: number; month: number; count: number }>();
  for (const r of rows) {
    const d = r.received_date!;
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const key = `${year}-${month}`;
    const entry = counts.get(key) ?? { year, month, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  let top: { year: number; month: number; count: number } | null = null;
  for (const entry of counts.values()) {
    if (!top || entry.count > top.count) top = entry;
  }
  return top;
}
