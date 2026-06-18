import { z } from "zod";

/**
 * Per-section schemas for inline editing on the job detail page. Each mirrors
 * the relevant slice of `reviewJobSchema` (including its cross-field rules) so a
 * single section can be validated and PATCHed on its own.
 */

export const detailsSectionSchema = z.object({
  payerName: z.string().optional(),
  contentType: z.string().min(1, "Content type is required"),
  platforms: z.array(z.string()).optional().default([]),
});

export const briefSectionSchema = z.object({
  briefLink: z.string().optional().nullable(),
  briefLinkNote: z.string().optional().nullable(),
  brief: z.string().optional().nullable(),
});

export const notesSectionSchema = z.object({
  notes: z.string().optional().nullable(),
});

export const incomeSectionSchema = z
  .object({
    isBrotherJob: z.boolean().default(false),
    hasWithholdingTax: z.boolean().default(false),
    amount: z.coerce.number().min(0).optional(),
    withholdingRate: z.coerce.number().min(0).max(100).default(3).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isBrotherJob) return;
    if (data.amount == null || data.amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Income (amount) is required",
        path: ["amount"],
      });
    }
  });

export const datesSectionSchema = z
  .object({
    receivedDate: z.string().min(1, "Received date is required"),
    reviewDeadline: z.string().optional().nullable(),
    publishDate: z.string().optional().nullable(),
    paymentDate: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
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
