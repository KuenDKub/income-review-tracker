import { NextResponse } from "next/server";
import {
  type StorylineSceneRow,
  type StorylineSections,
} from "@/lib/ai/storylineParser";
import { buildStorylineDocxBuffer } from "@/lib/docx/storylineWriter";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sections?: StorylineSections;
      scenesTable?: StorylineSceneRow[];
      filename?: string;
    };

    if (!body.sections || !body.scenesTable) {
      return NextResponse.json(
        { error: "sections and scenesTable are required" },
        { status: 400 },
      );
    }

    const sections = body.sections;
    const scenesTable = body.scenesTable;
    const buffer = buildStorylineDocxBuffer(sections, scenesTable);

    const filename = body.filename || "storyline.docx";

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

