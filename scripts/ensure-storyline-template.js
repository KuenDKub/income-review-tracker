/**
 * Ensures templates/storyline_template.docx exists with a professional layout:
 * - TITLE + SUBTITLE
 * - 3-column table: Scene | Text | Soundtrack
 * - CTA + CAPTION_IDEA
 *
 * Run with: node scripts/ensure-storyline-template.js
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const AdmZip = require("adm-zip");
const path = require("path");
const fs = require("fs");

const PLACEHOLDERS = ["TITLE", "CTA", "CAPTION_IDEA"];

// Clean-gray theme (slate accent). Word expects hex without '#'.
const COLORS = {
  text: "111827", // near-black
  muted: "6B7280",
  border: "D1D5DB",
  borderInner: "E5E7EB",
  headerFill: "F3F4F6",
  accent: "4B5563",
};

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
      <w:color w:val="${COLORS.text}"/>
      <w:sz w:val="22"/>
      <w:szCs w:val="22"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="60"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:bCs/>
      <w:color w:val="${COLORS.text}"/>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="MetaLabel">
    <w:name w:val="MetaLabel"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:bCs/>
      <w:color w:val="${COLORS.muted}"/>
      <w:sz w:val="18"/>
      <w:szCs w:val="18"/>
    </w:rPr>
  </w:style>
</w:styles>`;

const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:compat/>
</w:settings>`;

function buildDocumentXml() {
  const tikTokLine = `    <w:p>
      <w:pPr><w:pStyle w:val="MetaLabel"/><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:bCs/><w:color w:val="${COLORS.muted}"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>TikTok : francfoil</w:t></w:r>
    </w:p>`;

  const title = `    <w:p>
      <w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>{{TITLE}}</w:t></w:r>
    </w:p>`;

  const divider = `    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:pBdr><w:bottom w:val="single" w:sz="8" w:space="6" w:color="${COLORS.accent}"/></w:pBdr>
        <w:spacing w:before="0" w:after="120"/>
      </w:pPr>
      <w:r><w:t xml:space="preserve"> </w:t></w:r>
    </w:p>`;

  // Optional: Dress code (after title, before table)
  const optionalDressCodePlaceholder = `{{OPTIONAL_DRESS_CODE}}`;

  const tableHeader = `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9026" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblCellMar>
          <w:top w:w="120" w:type="dxa"/>
          <w:left w:w="120" w:type="dxa"/>
          <w:bottom w:w="120" w:type="dxa"/>
          <w:right w:w="120" w:type="dxa"/>
        </w:tblCellMar>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8" w:space="0" w:color="${COLORS.border}"/>
          <w:left w:val="single" w:sz="8" w:space="0" w:color="${COLORS.border}"/>
          <w:bottom w:val="single" w:sz="8" w:space="0" w:color="${COLORS.border}"/>
          <w:right w:val="single" w:sz="8" w:space="0" w:color="${COLORS.border}"/>
          <w:insideH w:val="single" w:sz="8" w:space="0" w:color="${COLORS.borderInner}"/>
          <w:insideV w:val="single" w:sz="8" w:space="0" w:color="${COLORS.borderInner}"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="3600"/>
        <w:gridCol w:w="1800"/>
        <w:gridCol w:w="3600"/>
      </w:tblGrid>
      <w:tr>
        <w:trPr><w:tblHeader/></w:trPr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3600" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="${COLORS.headerFill}"/>
            <w:vAlign w:val="center"/>
          </w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:b/><w:bCs/><w:color w:val="${COLORS.accent}"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>Scene (มุมกล้อง/outdoor)</w:t></w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1800" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="${COLORS.headerFill}"/>
            <w:vAlign w:val="center"/>
          </w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:b/><w:bCs/><w:color w:val="${COLORS.accent}"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>Text</w:t></w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3600" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="${COLORS.headerFill}"/>
            <w:vAlign w:val="center"/>
          </w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:b/><w:bCs/><w:color w:val="${COLORS.accent}"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>Soundtrack</w:t></w:r>
          </w:p>
        </w:tc>
      </w:tr>
      {{SCENES_TABLE_ROWS}}
    </w:tbl>`;

  const afterTableSpacing = `    <w:p><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>`;

  // Optional blocks: replaced by writer with full block or empty when section has no content
  const optionalCtaPlaceholder = `{{OPTIONAL_CTA}}`;
  const optionalVibePlaceholder = `{{OPTIONAL_VIBE}}`;
  const optionalCaptionPlaceholder = `{{OPTIONAL_CAPTION}}`;

  const sectPr = `    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
${tikTokLine}
${title}
${divider}
${optionalDressCodePlaceholder}
${optionalVibePlaceholder}
${tableHeader}
${afterTableSpacing}
${optionalCtaPlaceholder}
${optionalCaptionPlaceholder}
${sectPr}
  </w:body>
</w:document>`;
}

const outPath = path.join(
  process.cwd(),
  "templates",
  "storyline_template.docx",
);
const dir = path.dirname(outPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const zip = new AdmZip();
zip.addFile("[Content_Types].xml", Buffer.from(contentTypes, "utf-8"));
zip.addFile("_rels/.rels", Buffer.from(rels, "utf-8"));
zip.addFile("word/_rels/document.xml.rels", Buffer.from(documentRels, "utf-8"));
zip.addFile("word/document.xml", Buffer.from(buildDocumentXml(), "utf-8"));
zip.addFile("word/styles.xml", Buffer.from(stylesXml, "utf-8"));
zip.addFile("word/settings.xml", Buffer.from(settingsXml, "utf-8"));
zip.writeZip(outPath);
console.log("Written", outPath, "with placeholders:", PLACEHOLDERS.join(", "));
