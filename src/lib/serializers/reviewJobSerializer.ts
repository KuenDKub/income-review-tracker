/**
 * Serialize / deserialize ReviewJob DB rows to API JSON shape.
 */

export type ReviewJobRow = {
  id: string;
  payer_id: string;
  platforms: string[];
  content_type: string;
  title: string;
  job_date: Date;
  tags: string[];
  notes: string | null;
  created_at: Date;
};

export type ReviewJobJson = {
  id: string;
  payerId: string;
  platforms: string[];
  contentType: string;
  title: string;
  jobDate: string;
  tags: string[];
  notes: string | null;
  createdAt: string;
};

export function serializeReviewJob(row: ReviewJobRow): ReviewJobJson {
  return {
    id: row.id,
    payerId: row.payer_id,
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    contentType: row.content_type,
    title: row.title,
    jobDate: row.job_date instanceof Date ? row.job_date.toISOString().slice(0, 10) : String(row.job_date),
    tags: Array.isArray(row.tags) ? row.tags : [],
    notes: row.notes ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export function deserializeReviewJobBody(body: {
  payerId: string;
  platforms: string[];
  contentType: string;
  title: string;
  jobDate: string;
  tags?: string[];
  notes?: string | null;
}): {
  payer_id: string;
  platforms: string[];
  content_type: string;
  title: string;
  job_date: string;
  tags: string[];
  notes: string | null;
} {
  return {
    payer_id: body.payerId,
    platforms: Array.isArray(body.platforms) ? body.platforms : [],
    content_type: body.contentType,
    title: body.title,
    job_date: body.jobDate,
    tags: Array.isArray(body.tags) ? body.tags : [],
    notes: body.notes ?? null,
  };
}
