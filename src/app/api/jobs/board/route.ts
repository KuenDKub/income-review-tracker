import { NextResponse } from "next/server";
import { listJobs } from "@/controllers/jobsController";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const yearParam = url.searchParams.get("year");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const monthsParam = url.searchParams.get("months");

    const opts: Parameters<typeof listJobs>[0] = {
      page: 1,
      pageSize: 500,
      maxPageSize: 500,
    };

    if (yearParam) {
      const year = Number.parseInt(yearParam, 10);
      if (Number.isFinite(year) && year >= 1970 && year <= 2100) {
        opts.calendarFrom = `${year}-01-01`;
        opts.calendarTo = `${year}-12-31`;
      }
    } else if (fromParam && toParam) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(fromParam) && /^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
        opts.calendarFrom = fromParam;
        opts.calendarTo = toParam;
      }
    }

    if (!opts.calendarFrom) {
      const parsedMonths = monthsParam
        ? Number.parseInt(monthsParam, 10)
        : Number.NaN;
      opts.months =
        Number.isFinite(parsedMonths) && parsedMonths > 0 ? parsedMonths : 3;
    }

    const result = await listJobs(opts);
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/jobs/board:", err);
    return NextResponse.json(
      { error: "Failed to fetch jobs for board" },
      { status: 500 },
    );
  }
}
