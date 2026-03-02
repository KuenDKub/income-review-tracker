import { NextResponse } from "next/server";
import { listJobs } from "@/controllers/jobsController";

export async function GET() {
  try {
    const result = await listJobs({
      page: 1,
      pageSize: 500,
      maxPageSize: 500,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/jobs/board:", err);
    return NextResponse.json(
      { error: "Failed to fetch jobs for board" },
      { status: 500 }
    );
  }
}
