/**
 * Serialize / deserialize Income DB rows to API JSON shape.
 * TODO: Thailand - ensure dates and amounts align with PND 50/53 period grouping.
 */

// Numeric DB columns arrive as a string from raw pg, or a Prisma.Decimal object
// from the Prisma client. Both serialize to a JS number via Number().
type Numeric = string | number | { toString(): string };

export type IncomeRow = {
  id: string;
  review_job_id: string;
  gross_amount: Numeric;
  withholding_rate: Numeric;
  withholding_amount: Numeric;
  net_amount: Numeric;
  payment_date: Date;
  currency: string;
  withholding_cert_received?: boolean;
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
  withholdingCertReceived: boolean;
  createdAt: string;
};

function toNumber(v: Numeric): number {
  return typeof v === "number" ? v : Number(v);
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
    withholdingCertReceived: Boolean(row.withholding_cert_received),
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
  withholdingCertReceived?: boolean;
}): {
  review_job_id: string;
  gross_amount: number;
  withholding_rate: number;
  withholding_amount: number;
  net_amount: number;
  payment_date: string;
  currency: string;
  withholding_cert_received: boolean;
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
    withholding_cert_received: body.withholdingCertReceived ?? false,
  };
}
