/**
 * Review jobs API business logic. Route handlers parse request, validate with Zod, call here, serialize response.
 */

import { query } from "@/lib/db/client";
import {
  serializeReviewJob,
  deserializeReviewJobBody,
  type ReviewJobRow,
  type ReviewJobJson,
} from "@/lib/serializers/reviewJobSerializer";
import type { PaginatedResult } from "@/lib/pagination";

export async function listJobs(opts?: {
  page?: number;
  pageSize?: number;
  search?: string;
  payerName?: string;
  platform?: string;
  contentType?: string;
  status?: string;
}): Promise<PaginatedResult<ReviewJobJson>> {
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;

  const search = (opts?.search ?? "").trim();
  const payerName = (opts?.payerName ?? "").trim();
  const platform = (opts?.platform ?? "").trim();
  const contentType = (opts?.contentType ?? "").trim();
  const status = (opts?.status ?? "").trim();

  const where: string[] = [];
  const values: unknown[] = [];

  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    values.push(`%${search}%`);
    values.push(`%${search}%`);
    where.push(
      `(title ILIKE $${values.length - 2} OR EXISTS (SELECT 1 FROM unnest(platforms) p WHERE p ILIKE $${values.length - 1}) OR content_type ILIKE $${values.length})`
    );
  }
  if (payerName) {
    values.push(`%${payerName}%`);
    where.push(`payer_name ILIKE $${values.length}`);
  }
  if (platform) {
    values.push(platform);
    where.push(`$${values.length} = ANY(platforms)`);
  }
  if (contentType) {
    values.push(contentType);
    where.push(`content_type = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRes = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM review_jobs ${whereSql}`,
    values
  );
  const total = Number.parseInt(countRes.rows[0]?.total ?? "0", 10) || 0;

  values.push(pageSize);
  values.push(offset);
  const { rows } = await query<ReviewJobRow>(
    `SELECT * FROM review_jobs ${whereSql} ORDER BY COALESCE(received_date, created_at)::date DESC, created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  const jobIds = rows.map((r) => r.id);
  const incomeByJob = new Map<string, number>();
  if (jobIds.length > 0) {
    const incomeRows = await query<{ review_job_id: string; total_gross: string }>(
      `SELECT review_job_id, COALESCE(SUM(gross_amount), 0)::numeric AS total_gross FROM income WHERE review_job_id = ANY($1::uuid[]) GROUP BY review_job_id`,
      [jobIds]
    );
    for (const r of incomeRows.rows) {
      const amount = typeof r.total_gross === "string" ? parseFloat(r.total_gross) : r.total_gross;
      if (!Number.isNaN(amount) && amount > 0) incomeByJob.set(r.review_job_id, amount);
    }
  }

  return {
    data: rows.map((row) => {
      const job = serializeReviewJob(row);
      const grossAmount = incomeByJob.get(row.id) ?? null;
      return { ...job, grossAmount };
    }),
    total,
    page,
    pageSize,
  };
}

export async function listPayerNames(): Promise<string[]> {
  const { rows } = await query<{ payer_name: string }>(
    `SELECT DISTINCT payer_name FROM review_jobs WHERE payer_name IS NOT NULL AND payer_name != '' ORDER BY payer_name`
  );
  return rows.map((r) => r.payer_name);
}

export async function getJobById(id: string): Promise<ReviewJobJson | null> {
  const { rows } = await query<ReviewJobRow>(
    "SELECT * FROM review_jobs WHERE id = $1",
    [id]
  );
  if (rows.length === 0) return null;
  return serializeReviewJob(rows[0]);
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
  isBrotherJob?: boolean;
}): Promise<ReviewJobJson> {
  const data = deserializeReviewJobBody(body);
  const { rows } = await query<ReviewJobRow>(
    `INSERT INTO review_jobs (payer_name, status, platforms, content_type, title, received_date, review_deadline, publish_date, payment_date, tags, notes, is_brother_job)
     VALUES ($1, $2, $3::text[], $4, $5, $6::date, $7::date, $8::date, $9::date, $10::text[], $11, $12) RETURNING *`,
    [
      data.payer_name,
      data.status,
      data.platforms,
      data.content_type,
      data.title,
      data.received_date || null,
      data.review_deadline || null,
      data.publish_date || null,
      data.payment_date || null,
      data.tags,
      data.notes,
      data.is_brother_job,
    ]
  );
  return serializeReviewJob(rows[0]);
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
    isBrotherJob: boolean;
  }>
): Promise<ReviewJobJson | null> {
  const existing = await getJobById(id);
  if (!existing) return null;
  const data = deserializeReviewJobBody({
    payerName: body.payerName ?? existing.payerName ?? "",
    status: body.status ?? existing.status,
    platforms: body.platforms ?? existing.platforms,
    contentType: body.contentType ?? existing.contentType,
    title: body.title ?? existing.title,
    receivedDate: body.receivedDate ?? existing.receivedDate ?? null,
    reviewDeadline: body.reviewDeadline ?? existing.reviewDeadline ?? null,
    publishDate: body.publishDate ?? existing.publishDate ?? null,
    paymentDate: body.paymentDate ?? existing.paymentDate ?? null,
    tags: body.tags ?? existing.tags,
    notes: body.notes ?? existing.notes,
    isBrotherJob: body.isBrotherJob ?? existing.isBrotherJob ?? false,
  });
  const { rows } = await query<ReviewJobRow>(
    `UPDATE review_jobs SET payer_name = $1, status = $2, platforms = $3::text[], content_type = $4, title = $5, received_date = $6::date, review_deadline = $7::date, publish_date = $8::date, payment_date = $9::date, tags = $10::text[], notes = $11, is_brother_job = $12
     WHERE id = $13 RETURNING *`,
    [
      data.payer_name,
      data.status,
      data.platforms,
      data.content_type,
      data.title,
      data.received_date || null,
      data.review_deadline || null,
      data.publish_date || null,
      data.payment_date || null,
      data.tags,
      data.notes,
      data.is_brother_job,
      id,
    ]
  );
  if (rows.length === 0) return null;
  return serializeReviewJob(rows[0]);
}

export async function deleteJob(id: string): Promise<boolean> {
  const { rowCount } = await query("DELETE FROM review_jobs WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

/** List recent jobs (e.g. last 10) for dashboard */
export async function listRecentJobs(limit = 10): Promise<ReviewJobJson[]> {
  const { rows } = await query<ReviewJobRow>(
    "SELECT * FROM review_jobs ORDER BY COALESCE(received_date, created_at)::date DESC, created_at DESC LIMIT $1",
    [limit]
  );
  return rows.map(serializeReviewJob);
}

/** Top platform by job count (unnest platforms so one job can count per platform). */
export async function getTopPlatformByJobCount(): Promise<{
  name: string;
  count: number;
} | null> {
  const { rows } = await query<{ platform: string; cnt: string }>(
    `SELECT p AS platform, COUNT(*)::text AS cnt
     FROM review_jobs, unnest(platforms) AS p
     WHERE array_length(platforms, 1) > 0
     GROUP BY p ORDER BY cnt DESC LIMIT 1`
  );
  if (rows.length === 0) return null;
  return { name: rows[0].platform, count: parseInt(rows[0].cnt, 10) || 0 };
}

/** Top payer by job count. */
export async function getTopPayerByJobCount(): Promise<{
  name: string;
  count: number;
} | null> {
  const { rows } = await query<{ name: string; cnt: string }>(
    `SELECT payer_name AS name, COUNT(*)::text AS cnt
     FROM review_jobs
     WHERE payer_name IS NOT NULL AND payer_name != ''
     GROUP BY payer_name ORDER BY cnt DESC LIMIT 1`
  );
  if (rows.length === 0) return null;
  return { name: rows[0].name, count: parseInt(rows[0].cnt, 10) || 0 };
}

/** Top month by job count (by received_date). */
export async function getTopMonthByJobCount(): Promise<{
  year: number;
  month: number;
  count: number;
} | null> {
  const { rows } = await query<{ year: string; month: string; cnt: string }>(
    `SELECT EXTRACT(YEAR FROM received_date)::text AS year,
            EXTRACT(MONTH FROM received_date)::text AS month,
            COUNT(*)::text AS cnt
     FROM review_jobs
     WHERE received_date IS NOT NULL
     GROUP BY EXTRACT(YEAR FROM received_date), EXTRACT(MONTH FROM received_date)
     ORDER BY cnt DESC LIMIT 1`
  );
  if (rows.length === 0) return null;
  return {
    year: parseInt(rows[0].year, 10) || 0,
    month: parseInt(rows[0].month, 10) || 0,
    count: parseInt(rows[0].cnt, 10) || 0,
  };
}
