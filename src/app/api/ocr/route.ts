import { NextRequest, NextResponse } from "next/server";
import { callAIVision } from "@/lib/ai/openrouter";

const SYSTEM_PROMPT =
  "You are a precise OCR engine. Transcribe every piece of text in the image " +
  "exactly as written, preserving the original languages (Thai and English), " +
  "line breaks, and reading order. Do not translate, summarize, correct, or " +
  "explain anything, and do not add labels or commentary. Output only the " +
  "transcribed text. If the image contains no text, output nothing.";

const USER_PROMPT = "Transcribe all text in this image.";

/**
 * OCR a brief image with a vision model (via OpenRouter). The image is fetched
 * server-side and inlined as a base64 data URL so it works whether the source
 * is a public bucket URL or a same-origin upload — and the API key never leaves
 * the server. Auth is enforced by the global proxy middleware.
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 },
      );
    }

    const img = await fetch(imageUrl);
    if (!img.ok) {
      return NextResponse.json(
        { error: `Could not load image (${img.status})` },
        { status: 400 },
      );
    }
    const contentType = img.headers.get("content-type") || "image/png";
    const base64 = Buffer.from(await img.arrayBuffer()).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    const text = await callAIVision({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: USER_PROMPT,
      imageUrl: dataUrl,
    });

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error("POST /api/ocr:", err);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
