/**
 * Serialize / deserialize Income DB rows to API JSON shape.
 * TODO: Thailand - ensure dates and amounts align with PND 50/53 period grouping.
 */

export type IncomeRow = {
  id: string;
  review_job_id: string;
  gross_amount: string | number;
  withholding_rate: string | number;
  withholding_amount: string | number;
  net_amount: string | number;
  payment_date: Date;
  currency: string;
  created_at: Date;
};

export type IncomeJson = {
  id: string;
  reviewJobId: string;
  grossAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  netAmount: number;
  paymentDate: string;
  currency: string;
  createdAt: string;
};

function toNumber(v: string | number): number {
  return typeof v === "string" ? parseFloat(v) : v;
}

export function serializeIncome(row: IncomeRow): IncomeJson {
  return {
    id: row.id,
    reviewJobId: row.review_job_id,
    grossAmount: toNumber(row.gross_amount),
    withholdingRate: toNumber(row.withholding_rate),
    withholdingAmount: toNumber(row.withholding_amount),
    netAmount: toNumber(row.net_amount),
    paymentDate: row.payment_date instanceof Date ? row.payment_date.toISOString().slice(0, 10) : String(row.payment_date),
    currency: row.currency ?? "THB",
    createdAt: row.created_at.toISOString(),
  };
}

export function deserializeIncomeBody(body: {
  reviewJobId: string;
  grossAmount: number;
  withholdingRate?: number;
  withholdingAmount?: number;
  netAmount?: number;
  paymentDate: string;
  currency?: string;
}): {
  review_job_id: string;
  gross_amount: number;
  withholding_rate: number;
  withholding_amount: number;
  net_amount: number;
  payment_date: string;
  currency: string;
} {
  const rate = body.withholdingRate ?? 3;
  const gross = body.grossAmount;
  const withholding = body.withholdingAmount ?? Math.round(gross * (rate / 100) * 100) / 100;
  const net = body.netAmount ?? gross - withholding;
  return {
    review_job_id: body.reviewJobId,
    gross_amount: gross,
    withholding_rate: rate,
    withholding_amount: withholding,
    net_amount: net,
    payment_date: body.paymentDate,
    currency: body.currency ?? "THB",
  };
}
