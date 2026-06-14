/**
 * Build a one-page influencer media kit (.docx) from the creator's rate card
 * and headline stats. Uses the `docx` library programmatically (no template).
 *
 * Layout notes: tables use FIXED layout with explicit column widths. Thai text
 * has no spaces, so Word's default auto-layout collapses each column to a
 * single character per line — fixed widths are required to keep it readable.
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

const PINK = "EC4899"; // brand primary
const VIOLET = "8B5CF6"; // violet-500 — secondary accent
const GRAY = "6B7280";
const DARK = "111827";
const HEADER_FILL = "FDF2F8"; // pink-50 — header band + stat cards
const TABLE_HEAD_FILL = "FCE7F3"; // pink-100 — rate table header
const ZEBRA_FILL = "FAF5FF"; // violet-50 — alternating rows

// A Thai-friendly sans serif available in Google Docs / Word. Latin glyphs in
// this family are clean too, so one font covers the whole document.
const FONT = "Sarabun";

// Usable width with 1" margins on US Letter = 12240 - 2*1440 = 9360 dxa.
const CONTENT_WIDTH = 9360;

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

export type MediaKitRate = {
  platform: string;
  contentType: string;
  price: number;
  currency: string;
  notes: string | null;
};

export type MediaKitInput = {
  creatorName: string;
  handle: string;
  tagline?: string;
  stats: {
    totalDeals: number;
    brandCount: number;
    platforms: string[];
    firstDealYear: number | null;
  };
  rates: MediaKitRate[];
  /** UI labels (already localized by the caller). */
  labels: {
    rateCard: string;
    deliverable: string;
    platform: string;
    price: string;
    notes: string;
    dealsDone: string;
    brands: string;
    onPlatforms: string;
    since: string;
    generatedNote: string;
  };
};

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
function noBorders() {
  return { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
}

function formatPrice(price: number, currency: string): string {
  if (!(price > 0)) return "—";
  return `${price.toLocaleString("en-US")} ${currency}`;
}

function text(
  content: string,
  opts: {
    bold?: boolean;
    italics?: boolean;
    size?: number;
    color?: string;
  } = {},
): TextRun {
  return new TextRun({
    text: content,
    font: FONT,
    bold: opts.bold,
    italics: opts.italics,
    size: opts.size ?? 20,
    color: opts.color ?? DARK,
  });
}

/** A stat "card": big pink number over a muted label, on a soft pink fill. */
function statCell(value: string, label: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_FILL },
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: "FFFFFF" },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "FFFFFF" },
      left: { style: BorderStyle.SINGLE, size: 12, color: "FFFFFF" },
      right: { style: BorderStyle.SINGLE, size: 12, color: "FFFFFF" },
    },
    margins: { top: 160, bottom: 160, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [text(value, { bold: true, size: 44, color: PINK })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [text(label, { size: 16, color: GRAY })],
      }),
    ],
  });
}

function headCell(label: string, width: number, align: Align): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: TABLE_HEAD_FILL },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 90, bottom: 90, left: 150, right: 150 },
    children: [
      new Paragraph({
        alignment: align,
        children: [text(label, { bold: true, size: 19, color: DARK })],
      }),
    ],
  });
}

function bodyCell(
  content: string,
  width: number,
  opts: { bold?: boolean; color?: string; align?: Align; zebra?: boolean } = {},
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: opts.zebra ? { fill: ZEBRA_FILL } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [text(content || "—", { bold: opts.bold, size: 19, color: opts.color })],
      }),
    ],
  });
}

export async function buildMediaKitDocxBuffer(
  input: MediaKitInput,
): Promise<Buffer> {
  const { stats, labels } = input;

  // ---- Header band (soft pink card) ----
  const headerChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [text(input.creatorName, { bold: true, size: 52, color: DARK })],
    }),
  ];
  if (input.handle) {
    headerChildren.push(
      new Paragraph({
        spacing: { after: input.tagline ? 40 : 0 },
        children: [text(input.handle, { bold: true, size: 24, color: PINK })],
      }),
    );
  }
  if (input.tagline) {
    headerChildren.push(
      new Paragraph({
        spacing: { after: stats.platforms.length ? 60 : 0 },
        children: [text(input.tagline, { italics: true, size: 20, color: GRAY })],
      }),
    );
  }
  if (stats.platforms.length > 0) {
    headerChildren.push(
      new Paragraph({
        children: [
          text(stats.platforms.join("   •   "), { bold: true, size: 18, color: VIOLET }),
        ],
      }),
    );
  }

  const headerBand = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    borders: noBorders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: HEADER_FILL },
            margins: { top: 280, bottom: 280, left: 320, right: 320 },
            children: headerChildren,
          }),
        ],
      }),
    ],
  });

  // ---- Stats row (3 cards) ----
  const statW = Math.floor(CONTENT_WIDTH / 3);
  const statsTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [statW, statW, CONTENT_WIDTH - 2 * statW],
    borders: noBorders(),
    rows: [
      new TableRow({
        children: [
          statCell(String(stats.totalDeals), labels.dealsDone, statW),
          statCell(String(stats.brandCount), labels.brands, statW),
          statCell(String(stats.platforms.length), labels.onPlatforms, CONTENT_WIDTH - 2 * statW),
        ],
      }),
    ],
  });

  // ---- Rate table ----
  const cols = [4080, 1860, 1860, 1560]; // deliverable / platform / price / notes = 9360
  const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "F3D9E8" };
  const rateTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: cols,
    borders: {
      top: thinBorder,
      bottom: thinBorder,
      left: thinBorder,
      right: thinBorder,
      insideHorizontal: thinBorder,
      insideVertical: thinBorder,
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headCell(labels.deliverable, cols[0], AlignmentType.LEFT),
          headCell(labels.platform, cols[1], AlignmentType.LEFT),
          headCell(labels.price, cols[2], AlignmentType.RIGHT),
          headCell(labels.notes, cols[3], AlignmentType.LEFT),
        ],
      }),
      ...input.rates.map(
        (r, i) =>
          new TableRow({
            children: [
              bodyCell(r.contentType, cols[0], { bold: true, zebra: i % 2 === 1 }),
              bodyCell(r.platform, cols[1], { color: GRAY, zebra: i % 2 === 1 }),
              bodyCell(formatPrice(r.price, r.currency), cols[2], {
                bold: true,
                color: PINK,
                align: AlignmentType.RIGHT,
                zebra: i % 2 === 1,
              }),
              bodyCell(r.notes ?? "", cols[3], { color: GRAY, zebra: i % 2 === 1 }),
            ],
          }),
      ),
    ],
  });

  const footerParas: Paragraph[] = [];
  if (stats.firstDealYear != null) {
    footerParas.push(
      new Paragraph({
        spacing: { before: 240 },
        children: [text(`${labels.since} ${stats.firstDealYear}`, { size: 16, color: GRAY })],
      }),
    );
  }
  footerParas.push(
    new Paragraph({
      spacing: { before: footerParas.length ? 40 : 240 },
      children: [text(labels.generatedNote, { italics: true, size: 14, color: GRAY })],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: 20, color: DARK } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        children: [
          headerBand,
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          statsTable,
          new Paragraph({
            spacing: { before: 400, after: 140 },
            children: [text(labels.rateCard, { bold: true, size: 28, color: DARK })],
          }),
          rateTable,
          ...footerParas,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}
