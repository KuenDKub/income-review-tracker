import { NextResponse } from "next/server";
import { listJobs } from "@/controllers/jobsController";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const monthsParam = url.searchParams.get("months");
    const parsedMonths = monthsParam
      ? Number.parseInt(monthsParam, 10)
      : Number.NaN;
    const months =
      Number.isFinite(parsedMonths) && parsedMonths > 0 ? parsedMonths : 3;

    const result = await listJobs({
      page: 1,
      pageSize: 500,
      maxPageSize: 500,
      months,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/jobs/board:", err);
    return NextResponse.json(
      { error: "Failed to fetch jobs for board" },
      { status: 500 },
    );
  }
}
