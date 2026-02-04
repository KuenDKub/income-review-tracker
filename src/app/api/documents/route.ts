import { NextRequest, NextResponse } from "next/server";
import { createDocument, listDocumentsByJobId } from "@/controllers/documentsController";

export async function GET(request: NextRequest) {
  try {
    const reviewJobId = request.nextUrl.searchParams.get("reviewJobId");
    if (!reviewJobId) {
      return NextResponse.json({ error: "reviewJobId is required" }, { status: 400 });
    }
    const data = await listDocumentsByJobId(reviewJobId);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/documents:", err);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createDocument({
      reviewJobId: body.reviewJobId,
      incomeId: body.incomeId,
      kind: body.kind || "evidence",
      filePath: body.filePath,
      notes: body.notes,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/documents:", err);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
