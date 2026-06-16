/**
 * Invoice business logic: create (with auto-assigned number + amount snapshot),
 * list, update status, and the accounts-receivable read used by the payments
 * page. Amounts are snapshotted at creation so later edits to the job/income
 * never rewrite an issued invoice.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { serializeInvoice, type InvoiceJson } from "@/lib/serializers/invoiceSerializer";

export const INVOICE_STATUSES = ["unpaid", "paid", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** Round to 2 dp the same way the income serializer does. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Whole days from today (UTC) until a future date; negative if past. */
function daysUntil(d: Date | null): number {
  if (!d) return 0;
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

/**
 * Next invoice number for the issue year, formatted INV-YYYY-####. Computed from
 * the count of invoices already issued that year. Run inside the create
 * transaction so two near-simultaneous creates can't collide (the unique
 * constraint is the final backstop).
 */
async function nextInvoiceNumber(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<string> {
  const prefix = `INV-${year}-`;
  const count = await tx.invoices.count({
    where: { invoice_number: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export type CreateInvoiceInput = {
  reviewJobId: string;
  /** Gross amount billed. Defaults to the job's latest income gross, else 0. */
  subtotal?: number;
  withholdingRate?: number;
  issueDate?: string;
  /** NET payment term in days from the issue date (used when dueDate omitted). */
  netTermsDays?: number;
  dueDate?: string | null;
  description?: string;
  notes?: string;
  currency?: string;
};

export async function createInvoiceForJob(input: CreateInvoiceInput): Promise<InvoiceJson> {
  const row = await prisma.$transaction(async (tx) => {
    const job = await tx.review_jobs.findUnique({
      where: { id: input.reviewJobId },
      include: { income: { orderBy: { payment_date: "desc" }, take: 1 } },
    });
    if (!job) throw new Error("Review job not found");

    const latestIncome = job.income[0];
    const subtotal = round2(
      input.subtotal ?? (latestIncome ? Number(latestIncome.gross_amount) : 0),
    );
    const rate =
      input.withholdingRate ??
      (latestIncome ? Number(latestIncome.withholding_rate) : 3);
    const withholding = round2(subtotal * (rate / 100));
    const total = round2(subtotal - withholding);

    const issueDate = input.issueDate ? new Date(input.issueDate) : dateOnly(new Date());
    let dueDate: Date | null = null;
    if (input.dueDate) {
      dueDate = new Date(input.dueDate);
    } else if (input.netTermsDays != null) {
      dueDate = new Date(issueDate);
      dueDate.setUTCDate(dueDate.getUTCDate() + input.netTermsDays);
    } else {
      dueDate = new Date(issueDate);
      dueDate.setUTCDate(dueDate.getUTCDate() + 30);
    }

    const currency = input.currency ?? latestIncome?.currency ?? "THB";
    const number = await nextInvoiceNumber(tx, issueDate.getUTCFullYear());

    return tx.invoices.create({
      data: {
        review_job_id: job.id,
        invoice_number: number,
        issue_date: issueDate,
        due_date: dueDate,
        payer_name: job.payer_name,
        description: (input.description ?? job.title)?.trim() || job.title,
        currency,
        subtotal,
        withholding_rate: rate,
        withholding_amount: withholding,
        total,
        status: "unpaid",
        notes: input.notes?.trim() || null,
      },
    });
  });

  return serializeInvoice(row);
}

export async function listInvoicesForJob(reviewJobId: string): Promise<InvoiceJson[]> {
  const rows = await prisma.invoices.findMany({
    where: { review_job_id: reviewJobId },
    orderBy: { created_at: "desc" },
  });
  return rows.map(serializeInvoice);
}

export async function getInvoiceById(id: string): Promise<InvoiceJson | null> {
  const row = await prisma.invoices.findUnique({ where: { id } });
  return row ? serializeInvoice(row) : null;
}

/** Invoice + the parent job row, for document generation. */
export async function getInvoiceWithJob(id: string) {
  return prisma.invoices.findUnique({
    where: { id },
    include: { review_jobs: true },
  });
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
): Promise<InvoiceJson | null> {
  const row = await prisma.invoices.update({
    where: { id },
    data: { status, updated_at: new Date() },
  });
  return serializeInvoice(row);
}

export async function deleteInvoice(id: string): Promise<void> {
  await prisma.invoices.delete({ where: { id } });
}

export type OutstandingInvoice = InvoiceJson & {
  jobTitle: string;
  /** Whole days until due (negative = overdue). */
  daysUntilDue: number;
  overdue: boolean;
};

/** Open (unpaid) invoices for the accounts-receivable view, most-overdue first. */
export async function listOutstandingInvoices(): Promise<OutstandingInvoice[]> {
  const rows = await prisma.invoices.findMany({
    where: { status: "unpaid" },
    include: { review_jobs: { select: { title: true } } },
  });

  const items = rows.map((r) => {
    const due = r.due_date ?? null;
    const days = daysUntil(due);
    return {
      ...serializeInvoice(r),
      jobTitle: r.review_jobs?.title ?? "",
      daysUntilDue: days,
      overdue: due != null && days < 0,
    };
  });

  // Overdue first (most negative), then soonest-due, then no due date.
  items.sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.daysUntilDue - b.daysUntilDue;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
  return items;
}
