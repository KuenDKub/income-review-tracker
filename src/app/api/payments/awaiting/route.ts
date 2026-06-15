import { NextResponse } from "next/server";
import {
  listAwaitingPayment,
  countMissingWithholdingCerts,
} from "@/controllers/paymentsController";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [awaiting, missingCerts] = await Promise.all([
      listAwaitingPayment(),
      countMissingWithholdingCerts(),
    ]);
    return NextResponse.json({ data: { awaiting, missingCerts } });
  } catch (err) {
    console.error("GET /api/payments/awaiting:", err);
    return NextResponse.json(
      { data: { awaiting: [], missingCerts: 0 } },
      { status: 200 },
    );
  }
}
