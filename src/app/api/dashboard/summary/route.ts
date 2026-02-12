import { NextResponse } from "next/server";
import {
  getMonthlySummary,
  getYearlySummary,
} from "@/controllers/incomeController";
import {
  listRecentJobs,
  getTopPlatformByJobCount,
  getTopPayerByJobCount,
  getTopMonthByJobCount,
} from "@/controllers/jobsController";

const emptyData = {
  monthly: { gross: 0, withholding: 0, net: 0 },
  yearly: { gross: 0, withholding: 0, net: 0 },
  recentJobs: [] as Array<{ id: string; title: string; receivedDate: string | null }>,
  topPlatform: null as { name: string; count: number } | null,
  topPayer: null as { name: string; count: number } | null,
  topMonth: null as { year: number; month: number; count: number } | null,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(
    searchParams.get("year") ?? String(new Date().getFullYear()),
    10,
  );
  const month = parseInt(
    searchParams.get("month") ?? String(new Date().getMonth() + 1),
    10,
  );

  try {
    const [
      monthly,
      yearly,
      recentJobs,
      topPlatform,
      topPayer,
      topMonth,
    ] = await Promise.all([
      getMonthlySummary(year, month),
      getYearlySummary(year),
      listRecentJobs(10),
      getTopPlatformByJobCount(),
      getTopPayerByJobCount(),
      getTopMonthByJobCount(),
    ]);

    const data = {
      monthly: {
        gross: monthly.gross,
        withholding: monthly.withholding,
        net: monthly.net,
      },
      yearly: {
        gross: yearly.gross,
        withholding: yearly.withholding,
        net: yearly.net,
      },
      recentJobs: recentJobs.map((j) => ({
        id: j.id,
        title: j.title,
        receivedDate: j.receivedDate,
      })),
      topPlatform,
      topPayer,
      topMonth,
    };

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/dashboard/summary:", err);
    return NextResponse.json({ data: emptyData }, { status: 200 });
  }
}
