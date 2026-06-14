/**
 * Income API business logic. Route handlers parse request, validate with Zod, call here, serialize response.
 * TODO: Thailand - ensure summaries and exports can be grouped by payer for PND and reconciliation.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  serializeIncome,
  deserializeIncomeBody,
  type IncomeJson,
} from "@/lib/serializers/incomeSerializer";
import type { PaginatedResult } from "@/lib/pagination";

export async function listIncome(opts?: {
  page?: number;
  pageSize?: number;
  search?: string;
  reviewJobId?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  currency?: string;
}): Promise<PaginatedResult<IncomeJson>> {
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 10));

  const search = (opts?.search ?? "").trim();
  const reviewJobId = (opts?.reviewJobId ?? "").trim();
  const paymentDateFrom = (opts?.paymentDateFrom ?? "").trim();
  const paymentDateTo = (opts?.paymentDateTo ?? "").trim();
  const currency = (opts?.currency ?? "").trim();

  const where: Prisma.incomeWhereInput = {};
  if (search) {
    where.review_jobs = { is: { title: { contains: search, mode: "insensitive" } } };
  }
  if (reviewJobId) where.review_job_id = reviewJobId;
  if (currency) where.currency = currency;
  if (paymentDateFrom || paymentDateTo) {
    where.payment_date = {};
    if (paymentDateFrom) where.payment_date.gte = new Date(paymentDateFrom);
    if (paymentDateTo) where.payment_date.lte = new Date(paymentDateTo);
  }

  const [total, rows] = await Promise.all([
    prisma.income.count({ where }),
    prisma.income.findMany({
      where,
      orderBy: { payment_date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data: rows.map(serializeIncome),
    total,
    page,
    pageSize,
  };
}

export async function getIncomeById(id: string): Promise<IncomeJson | null> {
  const row = await prisma.income.findUnique({ where: { id } });
  return row ? serializeIncome(row) : null;
}

export async function createIncome(body: {
  reviewJobId: string;
  grossAmount: number;
  withholdingRate?: number;
  withholdingAmount?: number;
  netAmount?: number;
  paymentDate: string;
  currency?: string;
}): Promise<IncomeJson> {
  const data = deserializeIncomeBody(body);
  const row = await prisma.income.create({
    data: {
      review_job_id: data.review_job_id,
      gross_amount: data.gross_amount,
      withholding_rate: data.withholding_rate,
      withholding_amount: data.withholding_amount,
      net_amount: data.net_amount,
      payment_date: new Date(data.payment_date),
      currency: data.currency,
    },
  });
  return serializeIncome(row);
}

export async function updateIncome(
  id: string,
  body: Partial<{
    reviewJobId: string;
    grossAmount: number;
    withholdingRate: number;
    withholdingAmount: number;
    netAmount: number;
    paymentDate: string;
    currency: string;
  }>
): Promise<IncomeJson | null> {
  const existing = await getIncomeById(id);
  if (!existing) return null;
  const data = deserializeIncomeBody({
    reviewJobId: body.reviewJobId ?? existing.reviewJobId,
    grossAmount: body.grossAmount ?? existing.grossAmount,
    withholdingRate: body.withholdingRate ?? existing.withholdingRate,
    withholdingAmount: body.withholdingAmount ?? existing.withholdingAmount,
    netAmount: body.netAmount ?? existing.netAmount,
    paymentDate: body.paymentDate ?? existing.paymentDate,
    currency: body.currency ?? existing.currency,
  });
  const row = await prisma.income.update({
    where: { id },
    data: {
      review_job_id: data.review_job_id,
      gross_amount: data.gross_amount,
      withholding_rate: data.withholding_rate,
      withholding_amount: data.withholding_amount,
      net_amount: data.net_amount,
      payment_date: new Date(data.payment_date),
      currency: data.currency,
    },
  });
  return serializeIncome(row);
}

export async function deleteIncome(id: string): Promise<boolean> {
  const res = await prisma.income.deleteMany({ where: { id } });
  return res.count > 0;
}

// EXTRACT(YEAR/MONTH FROM payment_date) = N is equivalent to a [start, nextStart)
// range on the DATE column, which the typed API expresses with gte/lt.
function yearRange(year: number) {
  return { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
}
function monthRange(year: number, month: number) {
  return { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) };
}

/** Monthly summary: sum gross, withholding, net for a given month/year. TODO: Thailand - use calendar year for PND. */
export async function getMonthlySummary(
  year: number,
  month: number
): Promise<{ gross: number; withholding: number; net: number }> {
  const agg = await prisma.income.aggregate({
    where: { payment_date: monthRange(year, month) },
    _sum: { gross_amount: true, withholding_amount: true, net_amount: true },
  });
  return {
    gross: Number(agg._sum.gross_amount ?? 0),
    withholding: Number(agg._sum.withholding_amount ?? 0),
    net: Number(agg._sum.net_amount ?? 0),
  };
}

/** Yearly summary: sum gross, withholding, net for a given year. TODO: Thailand - calendar year for PND. */
export async function getYearlySummary(
  year: number
): Promise<{ gross: number; withholding: number; net: number }> {
  const agg = await prisma.income.aggregate({
    where: { payment_date: yearRange(year) },
    _sum: { gross_amount: true, withholding_amount: true, net_amount: true },
  });
  return {
    gross: Number(agg._sum.gross_amount ?? 0),
    withholding: Number(agg._sum.withholding_amount ?? 0),
    net: Number(agg._sum.net_amount ?? 0),
  };
}

export type MonthlyBreakdownItem = {
  month: number;
  year: number;
  gross: number;
  withholding: number;
  net: number;
};

/** Monthly breakdown for a year: one row per month that has income, summed. */
export async function getMonthlyBreakdownByYear(
  year: number
): Promise<MonthlyBreakdownItem[]> {
  const rows = await prisma.income.findMany({
    where: { payment_date: yearRange(year) },
    select: { payment_date: true, gross_amount: true, withholding_amount: true, net_amount: true },
  });
  const byMonth = new Map<number, MonthlyBreakdownItem>();
  for (const r of rows) {
    const month = r.payment_date.getUTCMonth() + 1;
    const item =
      byMonth.get(month) ?? { month, year, gross: 0, withholding: 0, net: 0 };
    item.gross += Number(r.gross_amount);
    item.withholding += Number(r.withholding_amount);
    item.net += Number(r.net_amount);
    byMonth.set(month, item);
  }
  return [...byMonth.values()].sort((a, b) => a.month - b.month);
}
