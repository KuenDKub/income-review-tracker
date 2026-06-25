This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database backups

The prod Neon database is backed up two ways:

- **Neon PITR (built-in):** point-in-time restore covers the very recent past
  with no setup. Use it for "I deleted a row an hour ago" recovery.
- **Daily logical dump:** the `Backup (DB + Storage)` GitHub Action
  (`.github/workflows/db-backup.yml`) runs every day (~02:00 Asia/Bangkok) and
  keeps gzipped artifacts for **30 days**. Two jobs:
  - `db` — `pg_dump` of Neon. Secret: `DATABASE_URL` (the **direct** Neon string,
    not the `-pooler` host).
  - `storage` — mirrors the Supabase Storage bucket (uploaded images/files),
    which the DB dump does **not** contain (it only stores their paths). Secrets:
    `SUPABASE_S3_ENDPOINT`, `SUPABASE_S3_ACCESS_KEY_ID`,
    `SUPABASE_S3_SECRET_ACCESS_KEY`, `SUPABASE_STORAGE_BUCKET` (same values as
    `.env`). Restore: extract the `.tar.gz`, then `aws s3 sync` it back.

### Restore from a daily artifact

1. GitHub → **Actions → DB Backup**, open a run, download the `db-backup-*` artifact.
2. Unzip the artifact, then the dump: `gunzip irt-db-YYYY-MM-DD.sql.gz`
3. **Restore into a fresh Neon branch first** (so you can verify before touching
   live data), then promote it:
   ```bash
   psql "<neon-branch-direct-url>" < irt-db-YYYY-MM-DD.sql
   ```

### Schema migrations are guarded

`npm run db:migrate` (`scripts/run-schema.js`) runs against **real prod**. It now:

- refuses to run if `src/lib/db/schema.sql` contains destructive statements
  (`DROP TABLE/COLUMN`, `TRUNCATE`, `ALTER ... DROP`, `DELETE` without `WHERE`)
  unless you pass `-- --allow-destructive`;
- wraps the whole file in one transaction (failure → full rollback).

Keep `schema.sql` additive + idempotent (`CREATE/ALTER ... IF NOT EXISTS`).
