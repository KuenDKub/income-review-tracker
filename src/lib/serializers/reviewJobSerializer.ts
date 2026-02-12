/**
 * Serialize / deserialize ReviewJob DB rows to API JSON shape.
 */

import type { ReviewJobStatus } from "@/lib/schemas/reviewJob";

function toDateStr(d: Date | null | undefined): string | null {
  if (d == null) return null;
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d);
}

export type ReviewJobRow = {
  id: string;
  payer_name: string | null;
  status: string;
  platforms: string[];
  content_type: string;
  title: string;
  received_date?: Date | null;
  review_deadline?: Date | null;
  publish_date?: Date | null;
  payment_date?: Date | null;
  tags: string[];
  notes: string | null;
  is_brother_job: boolean;
  created_at: Date;
};

export type ReviewJobJson = {
  id: string;
  payerName: string | null;
  status: ReviewJobStatus;
  platforms: string[];
  contentType: string;
  title: string;
  receivedDate: string | null;
  reviewDeadline: string | null;
  publishDate: string | null;
  paymentDate: string | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
  isBrotherJob: boolean;
  grossAmount?: number | null;
};

export function serializeReviewJob(row: ReviewJobRow): ReviewJobJson {
  return {
    id: row.id,
    payerName: row.payer_name ?? null,
    status: row.status as ReviewJobJson["status"],
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    contentType: row.content_type,
    title: row.title,
    receivedDate: toDateStr(row.received_date),
    reviewDeadline: toDateStr(row.review_deadline),
    publishDate: toDateStr(row.publish_date),
    paymentDate: toDateStr(row.payment_date),
    tags: Array.isArray(row.tags) ? row.tags : [],
    notes: row.notes ?? null,
    createdAt: row.created_at.toISOString(),
    isBrotherJob: Boolean(row.is_brother_job),
  };
}

export function deserializeReviewJobBody(body: {
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
}): {
  payer_name: string | null;
  status: string;
  platforms: string[];
  content_type: string;
  title: string;
  received_date: string | null;
  review_deadline: string | null;
  publish_date: string | null;
  payment_date: string | null;
  tags: string[];
  notes: string | null;
  is_brother_job: boolean;
} {
  return {
    payer_name: body.payerName?.trim() || null,
    status: body.status ?? "received",
    platforms: Array.isArray(body.platforms) ? body.platforms : [],
    content_type: body.contentType,
    title: body.title,
    received_date: body.receivedDate?.trim() || null,
    review_deadline: body.reviewDeadline?.trim() || null,
    publish_date: body.publishDate?.trim() || null,
    payment_date: body.paymentDate?.trim() || null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    notes: body.notes ?? null,
    is_brother_job: Object.prototype.hasOwnProperty.call(body, "isBrotherJob")
      ? Boolean((body as { isBrotherJob?: boolean }).isBrotherJob)
      : false,
  };
}
