import { z } from "zod";

export const REVIEW_JOB_STATUSES = [
  "received",
  "script_sent",
  "in_progress",
  "waiting_edit",
  "waiting_review",
  "approved_waiting_to_publish",
  "approved_pending",
  "paid",
] as const;
export type ReviewJobStatus = (typeof REVIEW_JOB_STATUSES)[number];

const reviewJobBaseSchema = z.object({
  payerName: z.string(),
  status: z.enum(REVIEW_JOB_STATUSES).default("received"),
  platforms: z.array(z.string()).optional().default([]),
  contentType: z.string().min(1, "Content type is required"),
  title: z.string().min(1, "Title is required"),
  receivedDate: z.string().min(1, "Received date is required"), // ISO date string
  reviewDeadline: z.string().optional().nullable(),
  publishDate: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  brief: z.string().optional().nullable(),
  briefLink: z.string().optional().nullable(),
  briefLinkNote: z.string().optional().nullable(),
  hasWithholdingTax: z.boolean().default(false),
  isBrotherJob: z.boolean().default(false),
  showOnPortfolio: z.boolean().default(true),
  amount: z.coerce.number().min(0).optional(),
  withholdingRate: z.coerce.number().min(0).max(100).default(3).optional(),
  netAmount: z.coerce.number().min(0).optional(),
  withholdingAmount: z.coerce.number().min(0).optional(),
});

export const reviewJobSchema = reviewJobBaseSchema.superRefine((data, ctx) => {
  if (data.isBrotherJob) {
    // Brother job: review-only, no income required; skip income validation.
    return;
  }

  // Income is optional at create time — a job is logged when it arrives and the
  // fee is filled in later (inline on the detail page). Only enforce a gross
  // amount when withholding tax is explicitly applied, since the tax can't be
  // computed without it.
  if (data.hasWithholdingTax) {
    if (data.amount == null || data.amount === undefined || data.amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Gross amount (full price) is required when withholding tax is applied",
        path: ["amount"],
      });
    }
  }

  const received = data.receivedDate?.trim() || null;
  const review = data.reviewDeadline?.trim() || null;
  const publish = data.publishDate?.trim() || null;
  const payment = data.paymentDate?.trim() || null;

  if (review && received && review < received) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Review deadline must be on or after received date",
      path: ["reviewDeadline"],
    });
  }
  const minPublish = review || received;
  if (publish && minPublish && publish < minPublish) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Publish date must be on or after review deadline / received date",
      path: ["publishDate"],
    });
  }
  const minPayment = publish || review || received;
  if (payment && minPayment && payment < minPayment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Payment date must be on or after publish / review / received date",
      path: ["paymentDate"],
    });
  }
});

export type ReviewJobInput = z.infer<typeof reviewJobSchema>;

export const reviewJobCreateSchema = reviewJobSchema;

/**
 * Minimal schema for the quick-create modal: just enough to log a new job.
 * Everything else (brief, income, extra dates) is added inline on the detail
 * page afterwards.
 */
export const reviewJobQuickCreateSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    payerName: z.string().optional(),
    platforms: z.array(z.string()).optional().default([]),
    contentType: z.string().min(1, "Content type is required"),
    status: z.enum(REVIEW_JOB_STATUSES).default("received"),
    receivedDate: z.string().min(1, "Received date is required"),
    // Optional extra dates, surfaced behind a collapsible section in the quick
    // form. The server validates the full schema (incl. date-ordering
    // refinement), so anything captured here is persisted on create.
    reviewDeadline: z.string().optional().nullable(),
    publishDate: z.string().optional().nullable(),
    // Optional income, surfaced behind a collapsible section. The fee can be
    // left blank here and filled in inline on the detail page later; when an
    // amount is given the server builds the Income row on create.
    isBrotherJob: z.boolean().default(false),
    showOnPortfolio: z.boolean().default(true),
    hasWithholdingTax: z.boolean().default(false),
    amount: z.coerce.number().min(0).optional(),
    withholdingRate: z.coerce.number().min(0).max(100).default(3).optional(),
  })
  .superRefine((data, ctx) => {
    // Mirror the full schema: a gross amount is required once withholding tax is
    // applied, since the tax can't be computed without it. Brother jobs carry no
    // income, so skip the check.
    if (data.isBrotherJob || !data.hasWithholdingTax) return;
    if (data.amount == null || data.amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Gross amount (full price) is required when withholding tax is applied",
        path: ["amount"],
      });
    }
  });

export type ReviewJobQuickCreateInput = z.infer<
  typeof reviewJobQuickCreateSchema
>;
// IMPORTANT: `.partial()` does NOT strip `.default(...)`. Any defaulted field
// left out of a PATCH body would otherwise be re-injected with its default and
// overwrite the stored value (e.g. a board status-only move would reset
// platforms/tags to [] and clear isBrotherJob/withholding). Re-declare every
// defaulted field as plain `.optional()` so absent keys stay absent and the
// controller can fall back to the existing row.
export const reviewJobUpdateSchema = reviewJobBaseSchema.partial().extend({
  payerName: z.string().optional(),
  status: z.enum(REVIEW_JOB_STATUSES).optional(),
  platforms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  hasWithholdingTax: z.boolean().optional(),
  isBrotherJob: z.boolean().optional(),
  showOnPortfolio: z.boolean().optional(),
  withholdingRate: z.coerce.number().min(0).max(100).optional(),
});
