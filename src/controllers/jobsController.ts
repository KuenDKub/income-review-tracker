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
  payerId?: string;
  platform?: string;
  contentType?: string;
  jobDateFrom?: string;
  jobDateTo?: string;
  year?: number;
  month?: number;
}): Promise<PaginatedResult<ReviewJobJson>> {
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;

  const search = (opts?.search ?? "").trim();
  const payerId = (opts?.payerId ?? "").trim();
  const platform = (opts?.platform ?? "").trim();
  const contentType = (opts?.contentType ?? "").trim();
  const jobDateFrom = (opts?.jobDateFrom ?? "").trim();
  const jobDateTo = (opts?.jobDateTo ?? "").trim();
  const year = opts?.year;
  const month = opts?.month;

  const where: string[] = [];
  const values: unknown[] = [];

  if (search) {
    values.push(`%${search}%`);
    values.push(`%${search}%`);
    values.push(`%${search}%`);
    where.push(
      `(title ILIKE $${values.length - 2} OR EXISTS (SELECT 1 FROM unnest(platforms) p WHERE p ILIKE $${values.length - 1}) OR content_type ILIKE $${values.length})`
    );
  }
  if (payerId) {
    values.push(payerId);
    where.push(`payer_id = $${values.length}`);
  }
  if (platform) {
    values.push(platform);
    where.push(`$${values.length} = ANY(platforms)`);
  }
  if (contentType) {
    values.push(contentType);
    where.push(`content_type = $${values.length}`);
  }
  if (year) {
    if (month) {
      values.push(year, month);
      where.push(`EXTRACT(YEAR FROM job_date) = $${values.length - 1} AND EXTRACT(MONTH FROM job_date) = $${values.length}`);
    } else {
      values.push(year);
      where.push(`EXTRACT(YEAR FROM job_date) = $${values.length}`);
    }
  }
  if (jobDateFrom) {
    values.push(jobDateFrom);
    where.push(`job_date >= $${values.length}::date`);
  }
  if (jobDateTo) {
    values.push(jobDateTo);
    where.push(`job_date <= $${values.length}::date`);
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
    `SELECT * FROM review_jobs ${whereSql} ORDER BY job_date DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return {
    data: rows.map(serializeReviewJob),
    total,
    page,
    pageSize,
  };
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
  payerId: string;
  platforms: string[];
  contentType: string;
  title: string;
  jobDate: string;
  tags?: string[];
  notes?: string | null;
}): Promise<ReviewJobJson> {
  const data = deserializeReviewJobBody(body);
  const { rows } = await query<ReviewJobRow>(
    `INSERT INTO review_jobs (payer_id, platforms, content_type, title, job_date, tags, notes)
     VALUES ($1, $2::text[], $3, $4, $5::date, $6::text[], $7) RETURNING *`,
    [
      data.payer_id,
      data.platforms,
      data.content_type,
      data.title,
      data.job_date,
      data.tags,
      data.notes,
    ]
  );
  return serializeReviewJob(rows[0]);
}

export async function updateJob(
  id: string,
  body: Partial<{
    payerId: string;
    platforms: string[];
    contentType: string;
    title: string;
    jobDate: string;
    tags: string[];
    notes: string | null;
  }>
): Promise<ReviewJobJson | null> {
  const existing = await getJobById(id);
  if (!existing) return null;
  const data = deserializeReviewJobBody({
    payerId: body.payerId ?? existing.payerId,
    platforms: body.platforms ?? existing.platforms,
    contentType: body.contentType ?? existing.contentType,
    title: body.title ?? existing.title,
    jobDate: body.jobDate ?? existing.jobDate,
    tags: body.tags ?? existing.tags,
    notes: body.notes ?? existing.notes,
  });
  const { rows } = await query<ReviewJobRow>(
    `UPDATE review_jobs SET payer_id = $1, platforms = $2::text[], content_type = $3, title = $4, job_date = $5::date, tags = $6::text[], notes = $7
     WHERE id = $8 RETURNING *`,
    [
      data.payer_id,
      data.platforms,
      data.content_type,
      data.title,
      data.job_date,
      data.tags,
      data.notes,
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
    "SELECT * FROM review_jobs ORDER BY job_date DESC LIMIT $1",
    [limit]
  );
  return rows.map(serializeReviewJob);
}
