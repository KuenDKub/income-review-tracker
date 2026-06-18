# Income Review Tracker

Single-user creator back-office (Next.js 16 / React 19 / TS / Prisma 7 / Postgres). Review jobs → income + Thai withholding tax → invoices → public portfolio. PWA with web push.

## 📓 Project notes live in the company vault
Planning, architecture, data model, conventions, and the decision log are kept in Obsidian, **not** in this repo:

- **Dashboard:** `~/Desktop/company-vault/projects/income-review-tracker/_home.md`
- **Conventions / gotchas:** `.../conventions.md` · **Architecture:** `.../architecture.md` · **Data model:** `.../data-model.md`
- **Decision log:** `.../decisions.md`

When doing non-trivial work, read `_home.md` first for current status + focus. **At the end of a working session, append what was decided to that project's `decisions.md`** (newest on top: date / decision / why / alternatives).

## 🔴 Always-on rules (do not break)
- **Real prod Postgres with live data.** Migrations must be **additive + idempotent** — no destructive drops. **Never hand-run SQL.** Schema is introspected from prod (`prisma:pull`/`generate`, `db:migrate`).
- **Prisma typed API only — no `$queryRaw`.** If it's not expressible in the typed API, compute it in JS/TS.
- All money is Prisma `Decimal(15,2)` — never floats. Withholding defaults to 3% (THB); apply Revenue Department rounding before storing `withholding_amount` (PND 50/53 domain).
- Single-user, **env-based auth** (no User model). Server-only secrets: `CRON_SECRET`, `CALENDAR_FEED_TOKEN`, `VAPID_PRIVATE_KEY`, OpenRouter/Supabase keys.

_See the vault `conventions.md` for the full list._
