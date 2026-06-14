import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Runtime client. Uses the POOLED DATABASE_URL (Neon -pooler / PgBouncer) through
// the pg driver adapter — the correct setup for Vercel serverless, where many
// short-lived function instances would otherwise exhaust direct DB connections.
// Migrations use DIRECT_URL instead (see prisma.config.ts), never this path.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
