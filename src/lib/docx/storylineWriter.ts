import path from "path";
import AdmZip from "adm-zip";
import type { StorylineSceneRow } from "@/lib/ai/storylineParser";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "templates",
  "storyline_template.docx"
);

// Formal neutral palette — this doc is shared with business partners.
const COLORS = {
  label: "4B5563", // gray-600 — section labels
  sceneTag: "374151", // gray-700 — scene number tag
  stripe: "F9FAFB", // gray-50 — subtle zebra striping on even rows
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paragraphsXmlFromText(text: string): string {
  const lines = (text ?? "").replace(/\r\n/g, "\n").split("\n");
  const nonEmpty = lines.length ? lines : [""];
  return nonEmpty
    .map((line) => {
      const safe = escapeXml(line);
      return `<w:p>
        <w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
            <w:color w:val="111827"/>
            <w:sz w:val="20"/><w:szCs w:val="20"/>
          </w:rPr>
          <w:t xml:space="preserve">${safe}</w:t>
        </w:r>
      </w:p>`;
    })
    .join("");
}

/** Optional section block: only output when content is non-empty. */
function optionalSectionBlock(label: string, content: string): string {
  const trimmed = (content ?? "").trim();
  if (!trimmed) return "";
  // Section heading: uppercase, letter-spaced, underlined with a hairline rule.
  const labelPara = `    <w:p>
      <w:pPr><w:pStyle w:val="MetaLabel"/><w:spacing w:before="360" w:after="120"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="D1D5DB"/></w:pBdr></w:pPr>
      <w:r><w:rPr><w:b/><w:bCs/><w:color w:val="${COLORS.label}"/><w:spacing w:val="40"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>${escapeXml(label.toUpperCase())}</w:t></w:r>
    </w:p>`;
  const contentXml = paragraphsXmlFromText(trimmed);
  return labelPara + "\n" + contentXml;
}

function normalizeAction(action: string): string {
  const a = (action ?? "").trim();
  if (!a) return "";
  // If older generations included "Scene 1:" etc, strip it to avoid duplication.
  return a
    .replace(/^\(?\s*scene\s*\d+\s*\)?\s*[:：-]?\s*/i, "")
    .trim();
}

function sceneRowXml(row: StorylineSceneRow): string {
  const cleaned = normalizeAction(row.action);
  // Scene number as a bold pink tag, action text underneath in body color.
  const sceneTag = `<w:p><w:pPr><w:spacing w:after="${cleaned ? 40 : 0}" w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:color w:val="${COLORS.sceneTag}"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>Scene ${row.index}</w:t></w:r></w:p>`;
  const actionCell = sceneTag + (cleaned ? paragraphsXmlFromText(cleaned) : "");

  // Subtle zebra striping on even rows.
  const stripe =
    row.index % 2 === 0
      ? `<w:shd w:val="clear" w:color="auto" w:fill="${COLORS.stripe}"/>`
      : "";
  const cell = (w: number, inner: string) =>
    `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${stripe}</w:tcPr>${inner}</w:tc>`;

  return `<w:tr>
    ${cell(3600, actionCell)}
    ${cell(1800, paragraphsXmlFromText(row.text))}
    ${cell(3600, paragraphsXmlFromText(row.soundtrack))}
  </w:tr>`;
}

function buildDocxZip(
  sections: Record<string, string>,
  scenesTable: StorylineSceneRow[]
): AdmZip {
  const zip = new AdmZip(TEMPLATE_PATH);
  let xml = zip.readAsText("word/document.xml");

  const rowsXml = (scenesTable ?? []).map(sceneRowXml).join("");
  xml = xml.replaceAll("{{SCENES_TABLE_ROWS}}", rowsXml);

  // Optional blocks: only include when section has content
  const optionalDressCode = optionalSectionBlock(
    "Dress code",
    sections.DRESS_CODE ?? ""
  );
  const optionalCta = optionalSectionBlock("CTA", sections.CTA ?? "");
  const optionalVibe = optionalSectionBlock("Vibe", sections.VIBE ?? "");
  const optionalCaption = optionalSectionBlock(
    "CAPTION IDEA",
    sections.CAPTION_IDEA ?? ""
  );
  xml = xml.replaceAll("{{OPTIONAL_DRESS_CODE}}", optionalDressCode);
  xml = xml.replaceAll("{{OPTIONAL_CTA}}", optionalCta);
  xml = xml.replaceAll("{{OPTIONAL_VIBE}}", optionalVibe);
  xml = xml.replaceAll("{{OPTIONAL_CAPTION}}", optionalCaption);

  // Title is always "Storyline - <title>"
  const titleDisplay = "Storyline - " + (sections.TITLE ?? "").trim();
  xml = xml.replaceAll("{{TITLE}}", escapeXml(titleDisplay));

  for (const [key, value] of Object.entries(sections)) {
    if (key === "CTA" || key === "CAPTION_IDEA" || key === "TITLE" || key === "DRESS_CODE" || key === "VIBE") continue; // already handled
    const safe = escapeXml(value ?? "");
    xml = xml.replaceAll(`{{${key}}}`, safe);
  }

  zip.updateFile("word/document.xml", Buffer.from(xml, "utf-8"));
  return zip;
}

export function buildStorylineDocxBuffer(
  sections: Record<string, string>,
  scenesTable: StorylineSceneRow[]
): Buffer {
  const zip = buildDocxZip(sections, scenesTable);
  return zip.toBuffer();
}

export function injectIntoDocx(
  sections: Record<string, string>,
  scenesTable: StorylineSceneRow[],
  outputPath: string
): string {
  const zip = buildDocxZip(sections, scenesTable);
  zip.writeZip(outputPath);
  return outputPath;
}
