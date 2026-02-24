import { z } from "zod";

export const REVIEW_JOB_STATUSES = [
  "received",
  "script_sent",
  "in_progress",
  "waiting_edit",
  "waiting_review",
  "approved_pending",
  "paid",
] as const;
export type ReviewJobStatus = (typeof REVIEW_JOB_STATUSES)[number];

const reviewJobBaseSchema = z.object({
  payerName: z.string(),
  status: z.enum(REVIEW_JOB_STATUSES).default("received"),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  contentType: z.string().min(1, "Content type is required"),
  title: z.string().min(1, "Title is required"),
  receivedDate: z.string().min(1, "Received date is required"), // ISO date string
  reviewDeadline: z.string().min(1, "Review deadline is required"),
  publishDate: z.string().min(1, "Publish date is required"),
  paymentDate: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  hasWithholdingTax: z.boolean().default(false),
  isBrotherJob: z.boolean().default(false),
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

  if (data.hasWithholdingTax) {
    if (data.amount == null || data.amount === undefined || data.amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Gross amount (full price) is required when withholding tax is applied",
        path: ["amount"],
      });
    }
  } else {
    if (data.amount == null || data.amount === undefined || data.amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Income (amount) is required",
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
      message: "Publish date must be on or after review deadline / received date",
      path: ["publishDate"],
    });
  }
  const minPayment = publish || review || received;
  if (payment && minPayment && payment < minPayment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Payment date must be on or after publish / review / received date",
      path: ["paymentDate"],
    });
  }
});

export type ReviewJobInput = z.infer<typeof reviewJobSchema>;

export const reviewJobCreateSchema = reviewJobSchema;
export const reviewJobUpdateSchema = reviewJobBaseSchema.partial().extend({
  payerName: z.string().optional(),
  status: z.enum(REVIEW_JOB_STATUSES).optional(),
});
