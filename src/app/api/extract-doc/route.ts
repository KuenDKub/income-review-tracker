import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { callAI } from "@/lib/ai/openrouter";

const SYSTEM_PROMPT =
  "You clean up brief documents for a content creator. You are given the raw " +
  "text extracted from a Word (.docx) brief — it may have broken line breaks, " +
  "leftover layout noise, repeated headers/footers, and stray whitespace. " +
  "Rewrite it as a clean, readable brief. Rules: preserve EVERY piece of " +
  "information — never drop, summarize, or invent content. Keep the original " +
  "languages exactly (Thai and English). Keep links, hashtags, dates, prices, " +
  "and product names verbatim. Group related lines, remove duplicate " +
  "headers/footers and empty noise, and use simple line breaks. Output only " +
  "the cleaned brief text — no labels, preamble, or commentary.";

/**
 * Extract the text from a Word (.docx) brief and tidy it for copying. `mammoth`
 * pulls the raw text server-side (no download needed by the user), then the
 * existing AI helper cleans the layout noise into a readable brief. The result
 * is surfaced in the same selectable/editable panel as image OCR, so a Word
 * brief becomes just as grab-able as a screenshot. Auth is enforced by the
 * global proxy middleware.
 */
export async function POST(request: NextRequest) {
  try {
    const { fileUrl } = await request.json();
    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "fileUrl is required" },
        { status: 400 },
      );
    }

    const file = await fetch(fileUrl);
    if (!file.ok) {
      return NextResponse.json(
        { error: `Could not load file (${file.status})` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { value: rawText } = await mammoth.extractRawText({ buffer });
    const raw = rawText.trim();
    if (!raw) return NextResponse.json({ text: "" });

    // Let the AI tidy the brief, but never let an AI hiccup lose the user's
    // text — fall back to the raw mammoth output if the call fails.
    let text = raw;
    try {
      const cleaned = (
        await callAI({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: raw,
          maxTokens: 2000,
        })
      ).trim();
      if (cleaned) text = cleaned;
    } catch (aiErr) {
      console.error("POST /api/extract-doc (AI cleanup):", aiErr);
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("POST /api/extract-doc:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
