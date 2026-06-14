import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 config. The CLI (db pull / migrate) connects using DIRECT_URL — the
// non-pooled Neon connection — so migrations never go through PgBouncer and
// never consume the serverless connection pool. The app runtime instead uses
// the pooled DATABASE_URL via the pg driver adapter (see src/lib/db/prisma.ts).
//
// We read DIRECT_URL via process.env (not prisma/config's `env()` helper) so the
// config still loads when the variable is absent — e.g. `prisma generate` during
// the Vercel install step, which never touches the datasource. Migrate/db pull
// will still fail loudly if it's missing, which is the correct behavior there.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
