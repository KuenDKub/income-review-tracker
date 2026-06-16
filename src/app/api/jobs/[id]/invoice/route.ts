import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createInvoiceForJob, listInvoicesForJob } from "@/controllers/invoiceController";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

const createSchema = z.object({
  subtotal: z.number().nonnegative().optional(),
  withholdingRate: z.number().min(0).max(100).optional(),
  issueDate: z.string().optional(),
  netTermsDays: z.number().int().min(0).max(365).optional(),
  dueDate: z.string().nullable().optional(),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  currency: z.string().max(8).optional(),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await listInvoicesForJob(id);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/jobs/[id]/invoice:", err);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = await createInvoiceForJob({ reviewJobId: id, ...parsed.data });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/jobs/[id]/invoice:", err);
    const message = err instanceof Error ? err.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
