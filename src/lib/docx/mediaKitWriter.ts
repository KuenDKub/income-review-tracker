/**
 * Build a polished influencer media kit (.docx) from the creator's profile,
 * headline stats, brand collaborations, and rate card. Uses the `docx` library
 * programmatically (no template).
 *
 * Design: a bold rose hero band (with optional avatar photo), three stat cards,
 * a "brands I've worked with" grid, and a services & rates table — each section
 * introduced by an accent-underlined header.
 *
 * Layout notes: tables use FIXED layout with explicit column widths. Thai text
 * has no spaces, so Word's default auto-layout collapses each column to a single
 * character per line — fixed widths are required to keep it readable.
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  TableLayoutType,
  VerticalAlign,
} from "docx";
import type { LoadedImage } from "./loadImage";

const PINK = "EC4899"; // brand primary
const ROSE_DEEP = "BE185D"; // pink-800 — hero fill (rich, white text on top)
const GRAY = "6B7280";
const DARK = "111827";
const WHITE = "FFFFFF";
const HERO_SUB = "FBCFE8"; // pink-200 — muted text on the rose hero
const HEADER_FILL = "FDF2F8"; // pink-50 — stat cards / brand chips
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

export type MediaKitCollab = {
  name: string;
  dealCount: number;
};

export type MediaKitInput = {
  creatorName: string;
  handle: string;
  tagline?: string;
  /** Optional avatar photo bytes (already fetched & format-checked). */
  avatar?: LoadedImage | null;
  stats: {
    totalDeals: number;
    brandCount: number;
    platforms: string[];
    firstDealYear: number | null;
  };
  rates: MediaKitRate[];
  collaborations?: MediaKitCollab[];
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
    allCaps?: boolean;
  } = {},
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

/** An accent-underlined section header: bold title + a pink rule beneath. */
function sectionHeader(label: string): Paragraph {
  return new Paragraph({
    spacing: { before: 420, after: 180 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 14, color: PINK, space: 6 },
    },
    children: [
      text("▍ ", { bold: true, size: 26, color: PINK }),
      text(label, { bold: true, size: 26, color: DARK }),
    ],
  });
}

/** A stat "card": big pink number over a muted label, on a soft pink fill. */
function statCell(value: string, label: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_FILL },
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: WHITE },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: WHITE },
      left: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
      right: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
    },
    margins: { top: 170, bottom: 170, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [text(value, { bold: true, size: 46, color: PINK })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [text(label, { size: 16, color: GRAY, allCaps: true })],
      }),
    ],
  });
}

/** A brand "chip" cell: name + a small count pill on a soft pink fill. */
function brandCell(c: MediaKitCollab | null, width: number): TableCell {
  if (!c) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
        bottom: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
        left: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
        right: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
      },
      children: [new Paragraph({ children: [] })],
    });
  }
  const runs: TextRun[] = [text(c.name, { bold: true, size: 19, color: DARK })];
  if (c.dealCount > 1) {
    runs.push(text(`   ${c.dealCount}×`, { bold: true, size: 16, color: PINK }));
  }
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_FILL },
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
      left: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
      right: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
    },
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: [new Paragraph({ children: runs })],
  });
}

function headCell(label: string, width: number, align: Align): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: TABLE_HEAD_FILL },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    children: [
      new Paragraph({
        alignment: align,
        children: [text(label, { bold: true, size: 19, color: ROSE_DEEP, allCaps: true })],
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
    margins: { top: 90, bottom: 90, left: 150, right: 150 },
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

  // ---- Hero band (rich rose fill, white text, optional avatar) ----
  const heroText: Paragraph[] = [
    new Paragraph({
      spacing: { after: 60 },
      children: [text("MEDIA KIT", { bold: true, size: 16, color: HERO_SUB, allCaps: true })],
    }),
    new Paragraph({
      spacing: { after: input.handle || input.tagline ? 40 : 0 },
      children: [text(input.creatorName, { bold: true, size: 54, color: WHITE })],
    }),
  ];
  if (input.handle) {
    heroText.push(
      new Paragraph({
        spacing: { after: input.tagline ? 60 : 0 },
        children: [text(input.handle, { bold: true, size: 24, color: HERO_SUB })],
      }),
    );
  }
  if (input.tagline) {
    heroText.push(
      new Paragraph({
        spacing: { after: stats.platforms.length ? 80 : 0 },
        children: [text(input.tagline, { italics: true, size: 21, color: "FCE7F3" })],
      }),
    );
  }
  if (stats.platforms.length > 0) {
    heroText.push(
      new Paragraph({
        children: [
          text(stats.platforms.join("    •    "), { bold: true, size: 18, color: WHITE }),
        ],
      }),
    );
  }

  // Avatar column (only if a usable image was provided).
  const AVATAR_COL = 1700;
  const hasAvatar = !!input.avatar;
  const heroRowChildren: TableCell[] = [];
  if (hasAvatar && input.avatar) {
    heroRowChildren.push(
      new TableCell({
        width: { size: AVATAR_COL, type: WidthType.DXA },
        shading: { fill: ROSE_DEEP },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 300, bottom: 300, left: 340, right: 60 },
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: input.avatar.data,
                type: input.avatar.type,
                transformation: { width: 110, height: 110 },
              }),
            ],
          }),
        ],
      }),
    );
  }
  heroRowChildren.push(
    new TableCell({
      width: { size: hasAvatar ? CONTENT_WIDTH - AVATAR_COL : CONTENT_WIDTH, type: WidthType.DXA },
      shading: { fill: ROSE_DEEP },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 300, bottom: 300, left: hasAvatar ? 260 : 360, right: 360 },
      children: heroText,
    }),
  );

  const heroBand = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: hasAvatar ? [AVATAR_COL, CONTENT_WIDTH - AVATAR_COL] : [CONTENT_WIDTH],
    borders: noBorders(),
    rows: [new TableRow({ children: heroRowChildren })],
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

  // ---- Brands grid (3 columns) ----
  const collabs = input.collaborations ?? [];
  let brandsBlock: (Paragraph | Table)[] = [];
  if (collabs.length > 0) {
    const COLS = 3;
    const brandW = Math.floor(CONTENT_WIDTH / COLS);
    const widths = [brandW, brandW, CONTENT_WIDTH - 2 * brandW];
    const rows: TableRow[] = [];
    for (let i = 0; i < collabs.length; i += COLS) {
      const cells: TableCell[] = [];
      for (let j = 0; j < COLS; j++) {
        cells.push(brandCell(collabs[i + j] ?? null, widths[j]));
      }
      rows.push(new TableRow({ children: cells }));
    }
    brandsBlock = [
      sectionHeader(labels.brands),
      new Table({
        layout: TableLayoutType.FIXED,
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: widths,
        borders: noBorders(),
        rows,
      }),
    ];
  }

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
        spacing: { before: 360 },
        children: [text(`${labels.since} ${stats.firstDealYear}`, { size: 16, color: GRAY })],
      }),
    );
  }
  footerParas.push(
    new Paragraph({
      spacing: { before: footerParas.length ? 40 : 360 },
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
          heroBand,
          new Paragraph({ spacing: { after: 220 }, children: [] }),
          statsTable,
          ...brandsBlock,
          sectionHeader(labels.rateCard),
          rateTable,
          ...footerParas,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}
