import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  INVOICE_STATUSES,
} from "@/controllers/invoiceController";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(INVOICE_STATUSES),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await getInvoiceById(id);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/invoices/[id]:", err);
    return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = await updateInvoiceStatus(id, parsed.data.status);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("PATCH /api/invoices/[id]:", err);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteInvoice(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/invoices/[id]:", err);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
