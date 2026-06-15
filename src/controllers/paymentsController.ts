/**
 * Payment / overdue tracking. Surfaces delivered work that has no income
 * recorded yet ("awaiting payment"), and withholding-tax certificates (50 ทวิ)
 * still outstanding. Read-side only; no schema-specific writes here.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Statuses that imply the work is delivered / approaching payment. */
const AWAITING_STATUSES = [
  "approved_waiting_to_publish",
  "approved_pending",
  "paid",
] as const;

export type AwaitingPaymentItem = {
  id: string;
  title: string;
  payerName: string | null;
  status: string;
  platforms: string[];
  /** YYYY-MM-DD of the most relevant date for aging, or null. */
  sinceDate: string | null;
  /** Whole days since `sinceDate` (0 if unknown / in the future). */
  ageDays: number;
};

function toDateStr(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** Whole days between a past date (UTC day) and today (UTC day). */
function daysSince(d: Date | null | undefined): number {
  if (!d) return 0;
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((today - day) / 86_400_000));
}

/**
 * Jobs that look delivered but have no income row recorded yet. Brother jobs
 * (review-only, no income) are excluded. Sorted oldest-first (most overdue).
 */
export async function listAwaitingPayment(): Promise<AwaitingPaymentItem[]> {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const where: Prisma.review_jobsWhereInput = {
    is_brother_job: false,
    income: { none: {} },
    OR: [
      { status: { in: [...AWAITING_STATUSES] } },
      { publish_date: { not: null, lte: today } },
    ],
  };

  const rows = await prisma.review_jobs.findMany({
    where,
    select: {
      id: true,
      title: true,
      payer_name: true,
      status: true,
      platforms: true,
      publish_date: true,
      review_deadline: true,
      received_date: true,
      created_at: true,
    },
  });

  const items = rows.map((r) => {
    const since = r.publish_date ?? r.review_deadline ?? r.received_date ?? r.created_at;
    return {
      id: r.id,
      title: r.title,
      payerName: r.payer_name ?? null,
      status: r.status,
      platforms: Array.isArray(r.platforms) ? r.platforms : [],
      sinceDate: toDateStr(since),
      ageDays: daysSince(since),
    };
  });

  items.sort((a, b) => b.ageDays - a.ageDays);
  return items;
}

/** Count of recorded withholding income rows whose 50 ทวิ cert is still missing. */
export async function countMissingWithholdingCerts(): Promise<number> {
  return prisma.income.count({
    where: {
      withholding_amount: { gt: 0 },
      withholding_cert_received: false,
    },
  });
}
