/**
 * Shared TypeScript types. Entity shapes are also inferred from Zod schemas in lib/schemas/.
 */
export type { ReviewJobRow, ReviewJobJson } from "@/lib/serializers/reviewJobSerializer";
export type { IncomeRow, IncomeJson } from "@/lib/serializers/incomeSerializer";
export type { ReviewJobInput } from "@/lib/schemas/reviewJob";
export type { IncomeInput } from "@/lib/schemas/income";
