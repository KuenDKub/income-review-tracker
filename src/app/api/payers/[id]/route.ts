import { NextRequest, NextResponse } from "next/server";
import {
  getPayerById,
  updatePayer,
  deletePayer,
} from "@/controllers/payersController";
import { payerUpdateSchema } from "@/lib/schemas/payer";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const data = await getPayerById(id);
    if (!data) {
      return NextResponse.json({ error: "Payer not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/payers/[id]:", err);
    return NextResponse.json(
      { error: "Failed to get payer" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = payerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = await updatePayer(id, parsed.data);
    if (!data) {
      return NextResponse.json({ error: "Payer not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("PATCH /api/payers/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update payer" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const deleted = await deletePayer(id);
    if (!deleted) {
      return NextResponse.json({ error: "Payer not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/payers/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete payer" },
      { status: 500 }
    );
  }
}
