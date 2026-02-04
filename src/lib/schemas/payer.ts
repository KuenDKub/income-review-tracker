import { z } from "zod";

export const payerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  taxId: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
});

export type PayerInput = z.infer<typeof payerSchema>;

export const payerCreateSchema = payerSchema;
export const payerUpdateSchema = payerSchema.partial();
