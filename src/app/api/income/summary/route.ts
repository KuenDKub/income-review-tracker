import { NextResponse } from "next/server";
import {
  getMonthlySummary,
  getYearlySummary,
  getMonthlyBreakdownByYear,
} from "@/controllers/incomeController";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(
    searchParams.get("year") ?? String(new Date().getFullYear()),
    10
  );
  const monthParam = searchParams.get("month");
  const month = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;

  try {
    const [monthly, yearly, byMonth] = await Promise.all([
      getMonthlySummary(year, month),
      getYearlySummary(year),
      getMonthlyBreakdownByYear(year),
    ]);

    return NextResponse.json({
      data: {
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
        byMonth,
      },
    });
  } catch (err) {
    console.error("GET /api/income/summary:", err);
    return NextResponse.json(
      {
        data: {
          monthly: { gross: 0, withholding: 0, net: 0 },
          yearly: { gross: 0, withholding: 0, net: 0 },
          byMonth: [],
        },
      },
      { status: 200 }
    );
  }
}
