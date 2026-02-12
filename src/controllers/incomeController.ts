/**
 * Income API business logic. Route handlers parse request, validate with Zod, call here, serialize response.
 * TODO: Thailand - ensure summaries and exports can be grouped by payer for PND and reconciliation.
 */

import { query } from "@/lib/db/client";
import {
  serializeIncome,
  deserializeIncomeBody,
  type IncomeRow,
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
  const offset = (page - 1) * pageSize;

  const search = (opts?.search ?? "").trim();
  const reviewJobId = (opts?.reviewJobId ?? "").trim();
  const paymentDateFrom = (opts?.paymentDateFrom ?? "").trim();
  const paymentDateTo = (opts?.paymentDateTo ?? "").trim();
  const currency = (opts?.currency ?? "").trim();

  const where: string[] = [];
  const values: unknown[] = [];

  // Optional search by job title via join (best-effort). If empty, no join needed in query planner.
  // We use EXISTS to avoid selecting from join in result shape.
  if (search) {
    values.push(`%${search}%`);
    where.push(
      `EXISTS (SELECT 1 FROM review_jobs rj WHERE rj.id = income.review_job_id AND rj.title ILIKE $${values.length})`
    );
  }
  if (reviewJobId) {
    values.push(reviewJobId);
    where.push(`review_job_id = $${values.length}`);
  }
  if (currency) {
    values.push(currency);
    where.push(`currency = $${values.length}`);
  }
  if (paymentDateFrom) {
    values.push(paymentDateFrom);
    where.push(`payment_date >= $${values.length}::date`);
  }
  if (paymentDateTo) {
    values.push(paymentDateTo);
    where.push(`payment_date <= $${values.length}::date`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRes = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM income ${whereSql}`,
    values
  );
  const total = Number.parseInt(countRes.rows[0]?.total ?? "0", 10) || 0;

  values.push(pageSize);
  values.push(offset);
  const { rows } = await query<IncomeRow>(
    `SELECT * FROM income ${whereSql} ORDER BY payment_date DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return {
    data: rows.map(serializeIncome),
    total,
    page,
    pageSize,
  };
}

export async function getIncomeById(id: string): Promise<IncomeJson | null> {
  const { rows } = await query<IncomeRow>("SELECT * FROM income WHERE id = $1", [
    id,
  ]);
  if (rows.length === 0) return null;
  return serializeIncome(rows[0]);
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
  const { rows } = await query<IncomeRow>(
    `INSERT INTO income (review_job_id, gross_amount, withholding_rate, withholding_amount, net_amount, payment_date, currency)
     VALUES ($1, $2, $3, $4, $5, $6::date, $7) RETURNING *`,
    [
      data.review_job_id,
      data.gross_amount,
      data.withholding_rate,
      data.withholding_amount,
      data.net_amount,
      data.payment_date,
      data.currency,
    ]
  );
  return serializeIncome(rows[0]);
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
  const { rows } = await query<IncomeRow>(
    `UPDATE income SET review_job_id = $1, gross_amount = $2, withholding_rate = $3, withholding_amount = $4, net_amount = $5, payment_date = $6::date, currency = $7
     WHERE id = $8 RETURNING *`,
    [
      data.review_job_id,
      data.gross_amount,
      data.withholding_rate,
      data.withholding_amount,
      data.net_amount,
      data.payment_date,
      data.currency,
      id,
    ]
  );
  if (rows.length === 0) return null;
  return serializeIncome(rows[0]);
}

export async function deleteIncome(id: string): Promise<boolean> {
  const { rowCount } = await query("DELETE FROM income WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

/** Monthly summary: sum gross, withholding, net for a given month/year. TODO: Thailand - use calendar year for PND. */
export async function getMonthlySummary(
  year: number,
  month: number
): Promise<{ gross: number; withholding: number; net: number }> {
  const { rows } = await query<{ sum_gross: string; sum_withholding: string; sum_net: string }>(
    `SELECT
       COALESCE(SUM(gross_amount), 0)::numeric AS sum_gross,
       COALESCE(SUM(withholding_amount), 0)::numeric AS sum_withholding,
       COALESCE(SUM(net_amount), 0)::numeric AS sum_net
     FROM income
     WHERE EXTRACT(YEAR FROM payment_date) = $1 AND EXTRACT(MONTH FROM payment_date) = $2`,
    [year, month]
  );
  const r = rows[0];
  if (!r)
    return { gross: 0, withholding: 0, net: 0 };
  return {
    gross: parseFloat(r.sum_gross),
    withholding: parseFloat(r.sum_withholding),
    net: parseFloat(r.sum_net),
  };
}

/** Yearly summary: sum gross, withholding, net for a given year. TODO: Thailand - calendar year for PND. */
export async function getYearlySummary(
  year: number
): Promise<{ gross: number; withholding: number; net: number }> {
  const { rows } = await query<{ sum_gross: string; sum_withholding: string; sum_net: string }>(
    `SELECT
       COALESCE(SUM(gross_amount), 0)::numeric AS sum_gross,
       COALESCE(SUM(withholding_amount), 0)::numeric AS sum_withholding,
       COALESCE(SUM(net_amount), 0)::numeric AS sum_net
     FROM income
     WHERE EXTRACT(YEAR FROM payment_date) = $1`,
    [year]
  );
  const r = rows[0];
  if (!r)
    return { gross: 0, withholding: 0, net: 0 };
  return {
    gross: parseFloat(r.sum_gross),
    withholding: parseFloat(r.sum_withholding),
    net: parseFloat(r.sum_net),
  };
}

export type MonthlyBreakdownItem = {
  month: number;
  year: number;
  gross: number;
  withholding: number;
  net: number;
};

/** Monthly breakdown for a year: one row per month with sums. */
export async function getMonthlyBreakdownByYear(
  year: number
): Promise<MonthlyBreakdownItem[]> {
  const { rows } = await query<{
    month: string;
    sum_gross: string;
    sum_withholding: string;
    sum_net: string;
  }>(
    `SELECT
       EXTRACT(MONTH FROM payment_date)::int AS month,
       COALESCE(SUM(gross_amount), 0)::numeric AS sum_gross,
       COALESCE(SUM(withholding_amount), 0)::numeric AS sum_withholding,
       COALESCE(SUM(net_amount), 0)::numeric AS sum_net
     FROM income
     WHERE EXTRACT(YEAR FROM payment_date) = $1
     GROUP BY EXTRACT(MONTH FROM payment_date)
     ORDER BY month`,
    [year]
  );
  return rows.map((r) => ({
    month: parseInt(r.month, 10),
    year,
    gross: parseFloat(r.sum_gross),
    withholding: parseFloat(r.sum_withholding),
    net: parseFloat(r.sum_net),
  }));
}
