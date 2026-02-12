import { NextRequest, NextResponse } from "next/server";
import { listJobs, createJob } from "@/controllers/jobsController";
import { createIncome } from "@/controllers/incomeController";
import { reviewJobCreateSchema } from "@/lib/schemas/reviewJob";
import { parsePagination } from "@/lib/pagination";

function buildIncomeFromJobPayload(
  _reviewJobId: string,
  payload: {
    hasWithholdingTax?: boolean;
    amount?: number;
    netAmount?: number;
    withholdingAmount?: number;
    paymentDate?: string | null;
    receivedDate?: string | null;
    publishDate?: string | null;
    reviewDeadline?: string | null;
  },
): {
  grossAmount: number;
  withholdingAmount: number;
  netAmount: number;
  paymentDate: string;
} | null {
  const paymentDate =
    payload.paymentDate?.trim() ||
    payload.receivedDate?.trim() ||
    payload.publishDate?.trim() ||
    payload.reviewDeadline?.trim() ||
    new Date().toISOString().slice(0, 10);
  if (payload.hasWithholdingTax) {
    const net = Number(payload.netAmount ?? 0);
    const withholding = Number(payload.withholdingAmount ?? 0);
    if (net <= 0 && withholding <= 0) return null;
    return {
      grossAmount: net + withholding,
      withholdingAmount: withholding,
      netAmount: net,
      paymentDate,
    };
  }
  const amount = Number(payload.amount ?? 0);
  if (amount <= 0) return null;
  return {
    grossAmount: amount,
    withholdingAmount: 0,
    netAmount: amount,
    paymentDate,
  };
}

export async function GET(request: NextRequest) {
  try {
    const pagination = parsePagination(request.nextUrl.searchParams, {
      defaultPageSize: 10,
      maxPageSize: 100,
    });
    const sp = request.nextUrl.searchParams;
    const result = await listJobs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: sp.get("search")?.trim() ?? "",
      payerName: sp.get("payerName")?.trim() ?? "",
      platform: sp.get("platform")?.trim() ?? "",
      contentType: sp.get("contentType")?.trim() ?? "",
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/jobs:", err);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reviewJobCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const payload = parsed.data;
    const data = await createJob({
      payerName: payload.payerName,
      status: payload.status ?? "received",
      platforms: payload.platforms,
      contentType: payload.contentType,
      title: payload.title,
      receivedDate: payload.receivedDate ?? null,
      reviewDeadline: payload.reviewDeadline ?? null,
      publishDate: payload.publishDate ?? null,
      paymentDate: payload.paymentDate ?? null,
      tags: payload.tags,
      notes: payload.notes,
    });
    const incomePayload = buildIncomeFromJobPayload(data.id, payload);
    if (incomePayload) {
      await createIncome({
        reviewJobId: data.id,
        grossAmount: incomePayload.grossAmount,
        withholdingAmount: incomePayload.withholdingAmount,
        netAmount: incomePayload.netAmount,
        paymentDate: incomePayload.paymentDate,
      });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/jobs:", err);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 },
    );
  }
}
