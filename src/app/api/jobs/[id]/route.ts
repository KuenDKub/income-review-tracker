import { NextRequest, NextResponse } from "next/server";
import { getJobById, updateJob, deleteJob } from "@/controllers/jobsController";
import {
  listIncome,
  createIncome,
  updateIncome,
  deleteIncome,
} from "@/controllers/incomeController";
import { reviewJobUpdateSchema } from "@/lib/schemas/reviewJob";
import { computeWithholdingAndNet } from "@/lib/tax";

type RouteParams = { params: Promise<{ id: string }> };

function buildIncomeFromJobPayload(
  _reviewJobId: string,
  payload: {
    hasWithholdingTax?: boolean;
    isBrotherJob?: boolean;
    amount?: number;
    withholdingRate?: number;
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
  if (payload.isBrotherJob) {
    return null;
  }
  if (payload.hasWithholdingTax) {
    const gross = Number(payload.amount ?? 0);
    const rate = Number(payload.withholdingRate ?? 3);
    if (gross <= 0) return null;
    const { withholdingAmount, netAmount } = computeWithholdingAndNet(gross, rate);
    return {
      grossAmount: gross,
      withholdingAmount,
      netAmount,
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

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const data = await getJobById(id);
    if (!data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/jobs/[id]:", err);
    return NextResponse.json({ error: "Failed to get job" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = reviewJobUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const payload = parsed.data;
    const data = await updateJob(id, payload);
    if (!data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (payload.isBrotherJob) {
      const { data: incomeList } = await listIncome({
        reviewJobId: id,
        pageSize: 100,
      });
      if (incomeList && incomeList.length > 0) {
        await Promise.all(incomeList.map((income) => deleteIncome(income.id)));
      }
    } else {
      const incomePayload = buildIncomeFromJobPayload(id, payload);
      if (incomePayload) {
        const { data: incomeList } = await listIncome({
          reviewJobId: id,
          pageSize: 1,
        });
        if (incomeList && incomeList.length > 0) {
          await updateIncome(incomeList[0].id, {
            grossAmount: incomePayload.grossAmount,
            withholdingAmount: incomePayload.withholdingAmount,
            netAmount: incomePayload.netAmount,
            paymentDate: incomePayload.paymentDate,
          });
        } else {
          await createIncome({
            reviewJobId: id,
            grossAmount: incomePayload.grossAmount,
            withholdingAmount: incomePayload.withholdingAmount,
            netAmount: incomePayload.netAmount,
            paymentDate: incomePayload.paymentDate,
          });
        }
      }
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("PATCH /api/jobs/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const deleted = await deleteJob(id);
    if (!deleted) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/jobs/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 },
    );
  }
}
