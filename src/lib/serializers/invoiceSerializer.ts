/**
 * Serialize Invoice DB rows to API JSON shape. Numeric columns arrive as a
 * Prisma.Decimal (or a raw string); both coerce to a JS number via Number().
 */

type Numeric = string | number | { toString(): string };

export type InvoiceRow = {
  id: string;
  review_job_id: string;
  invoice_number: string;
  issue_date: Date;
  due_date: Date | null;
  payer_name: string | null;
  description: string | null;
  currency: string;
  subtotal: Numeric;
  withholding_rate: Numeric;
  withholding_amount: Numeric;
  total: Numeric;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type InvoiceJson = {
  id: string;
  reviewJobId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  payerName: string | null;
  description: string | null;
  currency: string;
  subtotal: number;
  withholdingRate: number;
  withholdingAmount: number;
  total: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function toNumber(v: Numeric): number {
  return typeof v === "number" ? v : Number(v);
}

function toDateStr(d: Date | null): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d);
}

export function serializeInvoice(row: InvoiceRow): InvoiceJson {
  return {
    id: row.id,
    reviewJobId: row.review_job_id,
    invoiceNumber: row.invoice_number,
    issueDate: toDateStr(row.issue_date) ?? "",
    dueDate: toDateStr(row.due_date),
    payerName: row.payer_name,
    description: row.description,
    currency: row.currency ?? "THB",
    subtotal: toNumber(row.subtotal),
    withholdingRate: toNumber(row.withholding_rate),
    withholdingAmount: toNumber(row.withholding_amount),
    total: toNumber(row.total),
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
