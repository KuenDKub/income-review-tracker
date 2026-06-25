/**
 * Health check controller. Used by GET /api/health and daily-check script.
 */

export type HealthResult = {
  status: "ok" | "error";
  db?: "ok" | "error";
  cron?: "ok" | "stale" | "unknown";
  cronLastRunAt?: string;
  message?: string;
};

// The reminders cron runs daily; allow a generous grace window before flagging.
const CRON_STALE_MS = 25 * 60 * 60 * 1000;

export async function checkHealth(): Promise<HealthResult> {
  try {
    // Optional: ping DB if DATABASE_URL is set
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const { prisma } = await import("@/lib/db/prisma");
      try {
        // Lightweight typed query to verify DB connectivity.
        await prisma.review_jobs.count();
      } catch (dbErr) {
        return { status: "error", db: "error", message: String(dbErr) };
      }

      // Cron heartbeat: flag if the daily reminders job has gone silent.
      const run = await prisma.cron_runs.findUnique({
        where: { job_name: "reminders" },
      });
      if (!run) {
        // No run recorded yet (e.g. before the first cron fire) — not an error.
        return { status: "ok", db: "ok", cron: "unknown" };
      }
      const stale = Date.now() - run.last_run_at.getTime() > CRON_STALE_MS;
      return {
        status: stale ? "error" : "ok",
        db: "ok",
        cron: stale ? "stale" : "ok",
        cronLastRunAt: run.last_run_at.toISOString(),
        ...(stale ? { message: "reminders cron has not run in >25h" } : {}),
      };
    }
    return { status: "ok" };
  } catch (err) {
    return { status: "error", message: String(err) };
  }
}
