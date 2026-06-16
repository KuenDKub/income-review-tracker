/**
 * Build a clean invoice (.docx) from an invoice record + issuer (creator) and
 * payer details. Uses the `docx` library programmatically (no template).
 *
 * Layout: an issuer/title header band, a meta row (invoice no., issue & due
 * dates), a "bill to" block, a single line-item table with subtotal →
 * withholding tax → net total, then payment (bank) details.
 *
 * Thai text has no spaces, so the table uses a FIXED layout with explicit
 * column widths (same reasoning as the media-kit writer).
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  TableLayoutType,
  VerticalAlign,
} from "docx";

const PINK = "EC4899";
const DARK = "111827";
const GRAY = "6B7280";
const LINE = "E5E7EB";
const HEAD_FILL = "FCE7F3"; // pink-100
const TOTAL_FILL = "FDF2F8"; // pink-50
const FONT = "Sarabun";

// Usable width with 1" margins on US Letter = 12240 - 2*1440 = 9360 dxa.
const CONTENT_WIDTH = 9360;

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

export type InvoiceDocInput = {
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string | null;
  currency: string;
  description: string;
  subtotal: number;
  withholdingRate: number;
  withholdingAmount: number;
  total: number;
  notes: string | null;
  issuer: {
    name: string;
    taxId?: string;
    address?: string;
    phone?: string;
    email?: string | null;
    bankDetails?: string;
  };
  payerName: string;
  /** UI labels (already localized by the caller). */
  labels: {
    invoice: string;
    billedTo: string;
    invoiceNo: string;
    issueDate: string;
    dueDate: string;
    description: string;
    amount: string;
    subtotal: string;
    withholding: string;
    total: string;
    paymentDetails: string;
    taxId: string;
    notes: string;
    generatedNote: string;
  };
};

function text(
  content: string,
  opts: { bold?: boolean; italics?: boolean; size?: number; color?: string; allCaps?: boolean } = {},
): TextRun {
  return new TextRun({
    text: content,
    font: FONT,
    bold: opts.bold,
    italics: opts.italics,
    allCaps: opts.allCaps,
    size: opts.size ?? 20,
    color: opts.color ?? DARK,
  });
}

function para(
  runs: TextRun[],
  opts: { align?: Align; before?: number; after?: number } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 60 },
    children: runs,
  });
}

function money(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function lineCell(
  child: Paragraph,
  width: number,
  opts: { fill?: string; align?: Align; head?: boolean } = {},
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      right: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    },
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    children: [child],
  });
}

export async function buildInvoiceDocxBuffer(input: InvoiceDocInput): Promise<Buffer> {
  const { labels: L, issuer } = input;
  const descW = Math.round(CONTENT_WIDTH * 0.66);
  const amtW = CONTENT_WIDTH - descW;

  const issuerLines: Paragraph[] = [
    para([text(issuer.name || "—", { bold: true, size: 24 })], { after: 30 }),
  ];
  if (issuer.taxId)
    issuerLines.push(para([text(`${L.taxId}: ${issuer.taxId}`, { size: 18, color: GRAY })], { after: 20 }));
  if (issuer.address)
    issuerLines.push(para([text(issuer.address, { size: 18, color: GRAY })], { after: 20 }));
  const contactBits = [issuer.phone, issuer.email].filter(Boolean).join("  ·  ");
  if (contactBits) issuerLines.push(para([text(contactBits, { size: 18, color: GRAY })], { after: 20 }));

  const lineItemTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [descW, amtW],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          lineCell(para([text(L.description, { bold: true, size: 19 })]), descW, { fill: HEAD_FILL }),
          lineCell(para([text(L.amount, { bold: true, size: 19 })], { align: AlignmentType.RIGHT }), amtW, {
            fill: HEAD_FILL,
          }),
        ],
      }),
      new TableRow({
        children: [
          lineCell(para([text(input.description || "—", { size: 20 })]), descW),
          lineCell(para([text(money(input.subtotal, input.currency), { size: 20 })], { align: AlignmentType.RIGHT }), amtW),
        ],
      }),
      new TableRow({
        children: [
          lineCell(para([text(L.subtotal, { size: 20, color: GRAY })], { align: AlignmentType.RIGHT }), descW),
          lineCell(para([text(money(input.subtotal, input.currency), { size: 20 })], { align: AlignmentType.RIGHT }), amtW),
        ],
      }),
      new TableRow({
        children: [
          lineCell(
            para([text(`${L.withholding} (${input.withholdingRate}%)`, { size: 20, color: GRAY })], {
              align: AlignmentType.RIGHT,
            }),
            descW,
          ),
          lineCell(
            para([text(`- ${money(input.withholdingAmount, input.currency)}`, { size: 20 })], {
              align: AlignmentType.RIGHT,
            }),
            amtW,
          ),
        ],
      }),
      new TableRow({
        children: [
          lineCell(para([text(L.total, { bold: true, size: 22 })], { align: AlignmentType.RIGHT }), descW, {
            fill: TOTAL_FILL,
          }),
          lineCell(
            para([text(money(input.total, input.currency), { bold: true, size: 22, color: PINK })], {
              align: AlignmentType.RIGHT,
            }),
            amtW,
            { fill: TOTAL_FILL },
          ),
        ],
      }),
    ],
  });

  const children: Paragraph[] | (Paragraph | Table)[] = [
    // Header: issuer block + big INVOICE title.
    new Paragraph({
      spacing: { after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: PINK, space: 8 } },
      children: [text(L.invoice, { bold: true, size: 44, color: PINK, allCaps: true })],
    }),
    ...issuerLines,

    // Meta: invoice number + dates.
    para([text(`${L.invoiceNo}: `, { bold: true, color: GRAY }), text(input.invoiceNumber)], { before: 220 }),
    para([text(`${L.issueDate}: `, { bold: true, color: GRAY }), text(input.issueDate)]),
    ...(input.dueDate ? [para([text(`${L.dueDate}: `, { bold: true, color: GRAY }), text(input.dueDate)])] : []),

    // Bill to.
    para([text(L.billedTo, { bold: true, size: 22, color: DARK })], { before: 260, after: 40 }),
    para([text(input.payerName || "—", { size: 22 })], { after: 160 }),

    lineItemTable,
  ];

  if (issuer.bankDetails) {
    children.push(
      para([text(L.paymentDetails, { bold: true, size: 22 })], { before: 320, after: 40 }),
      ...issuer.bankDetails.split("\n").map((l) => para([text(l, { size: 20, color: GRAY })], { after: 20 })),
    );
  }

  if (input.notes) {
    children.push(
      para([text(L.notes, { bold: true, size: 20 })], { before: 240, after: 40 }),
      para([text(input.notes, { size: 19, color: GRAY })]),
    );
  }

  children.push(para([text(L.generatedNote, { italics: true, size: 16, color: GRAY })], { before: 360 }));

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
