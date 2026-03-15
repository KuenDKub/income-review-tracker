import type { StorylineSections, StorylineSceneRow } from "@/lib/ai/storylineParser";

const TIKTOK_FIXED = "francfoil";

/**
 * Build plain text export to match doc layout:
 * TikTok : francfoil
 * Storyline - <TITLE>
 * [optional: Dress code]
 * Table (Scene | Text | Soundtrack)
 * [optional: CTA]
 * [optional: CAPTION IDEA]
 */
export function buildStorylinePlainText(
  sections: StorylineSections,
  scenesTable: StorylineSceneRow[]
): string {
  const storylineLabel =
    (sections.TITLE ?? "").trim() || (sections.SUBTITLE ?? "").trim() || "";
  const dressCode = (sections.DRESS_CODE ?? "").trim();
  const cta = (sections.CTA ?? "").trim();
  const captionIdea = (sections.CAPTION_IDEA ?? "").trim();

  const lines: string[] = [
    `TikTok : ${TIKTOK_FIXED}`,
    storylineLabel ? `Storyline - ${storylineLabel}` : "Storyline",
    ...(dressCode ? [`Dress code : ${dressCode}`] : []),
    "",
  ];

  const sorted = [...scenesTable].sort((a, b) => a.index - b.index);
  for (const row of sorted) {
    lines.push(`Scene${row.index}: ${(row.action ?? "").trim()}`);
    lines.push(`Voice: ${(row.soundtrack ?? "").trim()}`);
    lines.push(`Text: ${(row.text ?? "").trim()}`);
    lines.push("");
  }

  if (cta) {
    lines.push("CTA");
    lines.push(cta);
    lines.push("");
  }
  if (captionIdea) {
    lines.push("CAPTION IDEA");
    lines.push(captionIdea);
  }

  return lines.join("\n").trimEnd();
}
