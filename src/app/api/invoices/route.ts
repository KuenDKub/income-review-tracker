import { NextResponse } from "next/server";
import { listOutstandingInvoices } from "@/controllers/invoiceController";

export const dynamic = "force-dynamic";

/** Open (unpaid) invoices for the accounts-receivable view. */
export async function GET() {
  try {
    const data = await listOutstandingInvoices();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/invoices:", err);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
