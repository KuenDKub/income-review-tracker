import { z } from "zod";

export const rateCardRowSchema = z.object({
  platform: z.string().default(""),
  contentType: z.string().min(1, "Content type is required"),
  price: z.coerce.number().min(0).default(0),
  currency: z.string().min(1).default("THB"),
  notes: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export const rateCardsSaveSchema = z.object({
  rows: z.array(rateCardRowSchema).max(100),
});

export type RateCardRowInput = z.infer<typeof rateCardRowSchema>;
