import { callAI } from "@/lib/ai/openrouter";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import {
  parseStoryline,
  type StorylineSceneRow,
  type StorylineSections,
} from "@/lib/ai/storylineParser";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MIN_SCENES = 6;
const MAX_SCENES = 15;
const MAX_RETRIES = 3;

function sendSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function generateWithMinScenes(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokensFirst: number;
}): Promise<{
  sections: StorylineSections;
  scenesTable: StorylineSceneRow[];
  rawText: string;
}> {
  const { systemPrompt, userPrompt, maxTokensFirst } = params;

  const strictHint =
    "\n\nCRITICAL REQUIREMENTS:\n" +
    "- Output MUST follow the exact format.\n" +
    `- [SCENES] MUST include at least ${MIN_SCENES} scenes and at most ${MAX_SCENES} scenes: SCENE 1..SCENE ${MIN_SCENES} (and up to SCENE ${MAX_SCENES}).\n` +
    "- Each scene MUST include ACTION:, TEXT:, SOUNDTRACK:.\n" +
    "- Use '---' as a separator between scenes.\n" +
    "- Do not skip scene numbers.\n" +
    "- You MUST also output non-empty [CTA] and [CAPTION_IDEA] sections at the end. Do NOT stop before writing them.\n";

  let lastText = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const maxTokens =
      attempt === 1 ? maxTokensFirst : Math.max(maxTokensFirst, 1800);
    const extra =
      attempt === 1
        ? strictHint
        : strictHint +
          `\nYou previously returned fewer than ${MIN_SCENES} scenes. Regenerate and ensure SCENE 1..5 exist.\n`;

    lastText = await callAI({
      systemPrompt: systemPrompt + extra,
      userPrompt,
      maxTokens,
    });

    const parsed = parseStoryline(lastText);
    const trimmedScenes = parsed.scenesTable.slice(0, MAX_SCENES);
    const hasCta = parsed.sections.CTA.trim().length > 0;
    const hasCaption = parsed.sections.CAPTION_IDEA.trim().length > 0;
    if (trimmedScenes.length >= MIN_SCENES && hasCta && hasCaption) {
      return {
        sections: parsed.sections,
        scenesTable: trimmedScenes,
        rawText: parsed.rawText,
      };
    }
  }

  // Final attempt: ask to OUTPUT ONLY the missing scenes block, then re-parse.
  const repairText = await callAI({
    systemPrompt:
      systemPrompt +
      "\n\nYou must output ONLY a correct [SCENES] block with at least 5 scenes in the required format. No other sections.\n",
    userPrompt:
      userPrompt +
      `\n\nตอนนี้ scenes ไม่ครบ ${MIN_SCENES} ซีน กรุณาสร้าง [SCENES] ใหม่ให้ครบ SCENE 1..5`,
    maxTokens: 1100,
  });

  const repairedParsed = parseStoryline(repairText);
  const trimmedRepairedScenes = repairedParsed.scenesTable.slice(0, MAX_SCENES);
  const hasCta = repairedParsed.sections.CTA.trim().length > 0;
  const hasCaption = repairedParsed.sections.CAPTION_IDEA.trim().length > 0;
  if (trimmedRepairedScenes.length >= MIN_SCENES && hasCta && hasCaption) {
    return {
      sections: repairedParsed.sections,
      scenesTable: trimmedRepairedScenes,
      rawText: repairedParsed.rawText,
    };
  }

  throw new Error(`AI returned fewer than ${MIN_SCENES} scenes`);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      reviewPrompt?: string;
      stream?: boolean;
    };
    const { reviewPrompt, stream: useStream } = body;
    if (!reviewPrompt) {
      return NextResponse.json(
        { error: "reviewPrompt required" },
        { status: 400 },
      );
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(reviewPrompt);

    if (useStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // 1) Generate full, validated storyline first (no partial output).
            const generated = await generateWithMinScenes({
              systemPrompt,
              userPrompt,
              maxTokensFirst: 1400,
            });

            const fullText = generated.rawText ?? "";

            // 2) Simulate streaming for UI animation using the completed text.
            const chunkSize = 80;
            for (let i = 0; i < fullText.length; i += chunkSize) {
              const chunk = fullText.slice(i, i + chunkSize);
              if (!chunk) continue;
              controller.enqueue(
                encoder.encode(sendSSE("delta", { delta: chunk })),
              );
            }

            const sections = generated.sections;
            const scenesTable = generated.scenesTable.slice(0, MAX_SCENES);

            controller.enqueue(
              encoder.encode(
                sendSSE("done", {
                  sections,
                  scenesTable,
                }),
              ),
            );
          } catch (err) {
            controller.enqueue(
              encoder.encode(
                sendSSE("error", {
                  error: err instanceof Error ? err.message : "Unknown error",
                }),
              ),
            );
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
          Connection: "keep-alive",
        },
      });
    }

    const generated = await generateWithMinScenes({
      systemPrompt,
      userPrompt,
      maxTokensFirst: 1400,
    });

    const sections = generated.sections;
    const scenesTable = generated.scenesTable;

    return NextResponse.json({
      success: true,
      sections,
      scenesTable,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
