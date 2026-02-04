import { NextRequest, NextResponse } from "next/server";
import { listIncome, createIncome } from "@/controllers/incomeController";
import { incomeCreateSchema } from "@/lib/schemas/income";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const pagination = parsePagination(request.nextUrl.searchParams, {
      defaultPageSize: 10,
      maxPageSize: 100,
    });
    const sp = request.nextUrl.searchParams;
    const result = await listIncome({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: sp.get("search")?.trim() ?? "",
      reviewJobId: sp.get("reviewJobId")?.trim() ?? "",
      paymentDateFrom: sp.get("paymentDateFrom")?.trim() ?? "",
      paymentDateTo: sp.get("paymentDateTo")?.trim() ?? "",
      currency: sp.get("currency")?.trim() ?? "",
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/income:", err);
    return NextResponse.json(
      { error: "Failed to list income" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = incomeCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const data = await createIncome({
      reviewJobId: payload.reviewJobId,
      grossAmount: payload.grossAmount,
      withholdingRate: payload.withholdingRate,
      withholdingAmount: payload.withholdingAmount,
      netAmount: payload.netAmount,
      paymentDate: payload.paymentDate,
      currency: payload.currency,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/income:", err);
    return NextResponse.json(
      { error: "Failed to create income" },
      { status: 500 }
    );
  }
}
