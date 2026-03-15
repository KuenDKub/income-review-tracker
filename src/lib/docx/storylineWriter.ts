import path from "path";
import AdmZip from "adm-zip";
import type { StorylineSceneRow } from "@/lib/ai/storylineParser";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "templates",
  "storyline_template.docx"
);

const COLORS = { muted: "6B7280", accent: "4B5563" };

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
  const labelPara = `    <w:p>
      <w:pPr><w:pStyle w:val="MetaLabel"/></w:pPr>
      <w:r><w:rPr><w:b/><w:bCs/><w:color w:val="${COLORS.muted}"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${escapeXml(label)}</w:t></w:r>
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
  const action = cleaned ? `(Scene ${row.index}) : ${cleaned}` : `(Scene ${row.index})`;
  return `<w:tr>
    <w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/></w:tcPr>${paragraphsXmlFromText(action)}</w:tc>
    <w:tc><w:tcPr><w:tcW w:w="1800" w:type="dxa"/></w:tcPr>${paragraphsXmlFromText(row.text)}</w:tc>
    <w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/></w:tcPr>${paragraphsXmlFromText(row.soundtrack)}</w:tc>
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
