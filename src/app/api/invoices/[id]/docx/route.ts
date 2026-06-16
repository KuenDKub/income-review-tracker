import { NextRequest, NextResponse } from "next/server";
import { getInvoiceWithJob } from "@/controllers/invoiceController";
import { getProfile } from "@/controllers/profileController";
import { buildInvoiceDocxBuffer } from "@/lib/docx/invoiceWriter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

const LABELS = {
  th: {
    invoice: "ใบแจ้งหนี้",
    billedTo: "เรียกเก็บจาก",
    invoiceNo: "เลขที่ใบแจ้งหนี้",
    issueDate: "วันที่ออก",
    dueDate: "ครบกำหนดชำระ",
    description: "รายการ",
    amount: "จำนวนเงิน",
    subtotal: "ยอดรวม",
    withholding: "หัก ณ ที่จ่าย",
    total: "ยอดสุทธิที่ต้องชำระ",
    paymentDetails: "รายละเอียดการชำระเงิน",
    taxId: "เลขประจำตัวผู้เสียภาษี",
    notes: "หมายเหตุ",
    generatedNote: "สร้างด้วย Income & Review Tracker",
  },
  en: {
    invoice: "Invoice",
    billedTo: "Billed to",
    invoiceNo: "Invoice no.",
    issueDate: "Issue date",
    dueDate: "Due date",
    description: "Description",
    amount: "Amount",
    subtotal: "Subtotal",
    withholding: "Withholding tax",
    total: "Net total due",
    paymentDetails: "Payment details",
    taxId: "Tax ID",
    notes: "Notes",
    generatedNote: "Generated with Income & Review Tracker",
  },
} as const;

function toDateStr(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const locale = new URL(req.url).searchParams.get("locale") === "en" ? "en" : "th";

    const [inv, profile] = await Promise.all([getInvoiceWithJob(id), getProfile()]);
    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buffer = await buildInvoiceDocxBuffer({
      invoiceNumber: inv.invoice_number,
      issueDate: toDateStr(inv.issue_date) ?? "",
      dueDate: toDateStr(inv.due_date),
      currency: inv.currency,
      description: inv.description ?? inv.review_jobs?.title ?? "",
      subtotal: Number(inv.subtotal),
      withholdingRate: Number(inv.withholding_rate),
      withholdingAmount: Number(inv.withholding_amount),
      total: Number(inv.total),
      notes: inv.notes,
      issuer: {
        name: profile.legalName || profile.creatorName || "",
        taxId: profile.taxId || undefined,
        address: profile.address || undefined,
        phone: profile.phone || undefined,
        email: profile.contactEmail,
        bankDetails: profile.bankDetails || undefined,
      },
      payerName: inv.payer_name ?? inv.review_jobs?.payer_name ?? "",
      labels: LABELS[locale],
    });

    const filename = `${inv.invoice_number}.docx`;
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("GET /api/invoices/[id]/docx:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
