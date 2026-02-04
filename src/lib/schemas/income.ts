import { z } from "zod";

// TODO: Thailand - apply Revenue Department rounding rules before storing withholding_amount and in PND-related export.
export const incomeSchema = z.object({
  reviewJobId: z.string().uuid(),
  grossAmount: z.coerce.number().min(0, "Gross amount must be non-negative"),
  withholdingRate: z.coerce.number().min(0).max(100).default(3), // e.g. 3% หัก ณ ที่จ่าย
  withholdingAmount: z.number().min(0).optional(), // computed or stored
  netAmount: z.number().min(0).optional(), // gross - withholding
  paymentDate: z.string().min(1, "Payment date is required"), // ISO date
  currency: z.string().length(3).default("THB"),
});

export type IncomeInput = z.infer<typeof incomeSchema>;

export const incomeCreateSchema = incomeSchema;
export const incomeUpdateSchema = incomeSchema.partial().extend({
  reviewJobId: z.string().uuid().optional(),
});
