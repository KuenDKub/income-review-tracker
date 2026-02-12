import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { getStorage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "";
    const storageKey = `evidence/${randomUUID()}-${Date.now()}.${ext}`;

    const storage = getStorage();
    if (storage) {
      const result = await storage.upload(
        buffer,
        storageKey,
        file.type || "application/octet-stream",
        file.name
      );
      return NextResponse.json({
        filePath: result.filePath,
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
      });
    }

    // Fallback: local filesystem (dev only)
    const filename = storageKey.split("/").pop()!;
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      filePath: `/uploads/${filename}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (err) {
    console.error("POST /api/upload:", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
