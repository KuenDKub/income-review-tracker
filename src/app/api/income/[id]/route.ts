import { NextRequest, NextResponse } from "next/server";
import {
  getIncomeById,
  updateIncome,
  deleteIncome,
} from "@/controllers/incomeController";
import { incomeUpdateSchema } from "@/lib/schemas/income";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const data = await getIncomeById(id);
    if (!data) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/income/[id]:", err);
    return NextResponse.json(
      { error: "Failed to get income" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = incomeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await updateIncome(id, parsed.data);
    if (!data) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("PATCH /api/income/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update income" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const deleted = await deleteIncome(id);
    if (!deleted) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/income/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete income" },
      { status: 500 }
    );
  }
}
