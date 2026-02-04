import { NextRequest, NextResponse } from "next/server";
import { getJobById, updateJob, deleteJob } from "@/controllers/jobsController";
import { reviewJobUpdateSchema } from "@/lib/schemas/reviewJob";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const data = await getJobById(id);
    if (!data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/jobs/[id]:", err);
    return NextResponse.json(
      { error: "Failed to get job" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = reviewJobUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await updateJob(id, parsed.data);
    if (!data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("PATCH /api/jobs/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const deleted = await deleteJob(id);
    if (!deleted) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/jobs/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
