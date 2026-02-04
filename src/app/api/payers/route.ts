import { NextRequest, NextResponse } from "next/server";
import { listPayers, createPayer } from "@/controllers/payersController";
import { payerCreateSchema } from "@/lib/schemas/payer";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const pagination = parsePagination(request.nextUrl.searchParams, {
      defaultPageSize: 10,
      maxPageSize: 100,
    });
    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
    const result = await listPayers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/payers:", err);
    return NextResponse.json(
      { error: "Failed to list payers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = payerCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const data = await createPayer({
      name: payload.name,
      taxId: payload.taxId,
      contactEmail: payload.contactEmail,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/payers:", err);
    return NextResponse.json(
      { error: "Failed to create payer" },
      { status: 500 }
    );
  }
}
