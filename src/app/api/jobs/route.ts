import { NextRequest, NextResponse } from "next/server";
import { listJobs, createJob } from "@/controllers/jobsController";
import { reviewJobCreateSchema } from "@/lib/schemas/reviewJob";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const pagination = parsePagination(request.nextUrl.searchParams, {
      defaultPageSize: 10,
      maxPageSize: 100,
    });
    const sp = request.nextUrl.searchParams;
    const yearParam = sp.get("year");
    const monthParam = sp.get("month");
    const result = await listJobs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: sp.get("search")?.trim() ?? "",
      payerId: sp.get("payerId")?.trim() ?? "",
      platform: sp.get("platform")?.trim() ?? "",
      contentType: sp.get("contentType")?.trim() ?? "",
      jobDateFrom: sp.get("jobDateFrom")?.trim() ?? "",
      jobDateTo: sp.get("jobDateTo")?.trim() ?? "",
      year: yearParam ? Number.parseInt(yearParam, 10) : undefined,
      month: monthParam ? Number.parseInt(monthParam, 10) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/jobs:", err);
    return NextResponse.json(
      { error: "Failed to list jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reviewJobCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const data = await createJob({
      payerId: payload.payerId,
      platforms: payload.platforms,
      contentType: payload.contentType,
      title: payload.title,
      jobDate: payload.jobDate,
      tags: payload.tags,
      notes: payload.notes,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/jobs:", err);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
