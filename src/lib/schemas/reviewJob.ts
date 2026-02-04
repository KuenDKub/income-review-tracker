import { z } from "zod";

export const reviewJobSchema = z.object({
  payerId: z.string().uuid(),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  contentType: z.string().min(1, "Content type is required"),
  title: z.string().min(1, "Title is required"),
  jobDate: z.string().min(1, "Job date is required"), // ISO date string
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
});

export type ReviewJobInput = z.infer<typeof reviewJobSchema>;

export const reviewJobCreateSchema = reviewJobSchema;
export const reviewJobUpdateSchema = reviewJobSchema.partial().extend({
  payerId: z.string().uuid().optional(),
});
