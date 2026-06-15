import { NextResponse } from "next/server";
import { listUpcomingPosts } from "@/controllers/jobsController";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listUpcomingPosts();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/jobs/upcoming-posts:", err);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
