/**
 * Health check controller. Used by GET /api/health and daily-check script.
 */

export type HealthResult = {
  status: "ok" | "error";
  db?: "ok" | "error";
  message?: string;
};

export async function checkHealth(): Promise<HealthResult> {
  try {
    // Optional: ping DB if DATABASE_URL is set
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const { prisma } = await import("@/lib/db/prisma");
        // Lightweight typed query to verify DB connectivity.
        await prisma.review_jobs.count();
      } catch (dbErr) {
        return { status: "error", db: "error", message: String(dbErr) };
      }
      return { status: "ok", db: "ok" };
    }
    return { status: "ok" };
  } catch (err) {
    return { status: "error", message: String(err) };
  }
}
