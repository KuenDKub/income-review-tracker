import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(env: unknown): Env {
  return envSchema.parse(env);
}
