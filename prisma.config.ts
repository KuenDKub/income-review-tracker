import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 config. The CLI (db pull / migrate) connects using DIRECT_URL — the
// non-pooled Neon connection — so migrations never go through PgBouncer and
// never consume the serverless connection pool. The app runtime instead uses
// the pooled DATABASE_URL via the pg driver adapter (see src/lib/db/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
