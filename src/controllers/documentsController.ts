/**
 * Documents API business logic.
 */

import { prisma } from "@/lib/db/prisma";

export type DocumentRow = {
  id: string;
  review_job_id: string | null;
  income_id: string | null;
  kind: string;
  file_path: string | null;
  notes: string | null;
  created_at: Date;
};

export type DocumentJson = {
  id: string;
  reviewJobId: string | null;
  incomeId: string | null;
  kind: string;
  filePath: string | null;
  notes: string | null;
  createdAt: string;
};

export function serializeDocument(row: DocumentRow): DocumentJson {
  return {
    id: row.id,
    reviewJobId: row.review_job_id,
    incomeId: row.income_id,
    kind: row.kind,
    filePath: row.file_path,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createDocument(body: {
  reviewJobId?: string;
  incomeId?: string;
  kind: string;
  filePath: string;
  notes?: string | null;
}): Promise<DocumentJson> {
  const row = await prisma.documents.create({
    data: {
      review_job_id: body.reviewJobId || null,
      income_id: body.incomeId || null,
      kind: body.kind,
      file_path: body.filePath,
      notes: body.notes || null,
    },
  });
  return serializeDocument(row);
}

export async function listDocumentsByJobId(jobId: string): Promise<DocumentJson[]> {
  const rows = await prisma.documents.findMany({
    where: { review_job_id: jobId },
    orderBy: { created_at: "desc" },
  });
  return rows.map(serializeDocument);
}

export async function getDocumentById(id: string): Promise<DocumentJson | null> {
  const row = await prisma.documents.findUnique({ where: { id } });
  return row ? serializeDocument(row) : null;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const doc = await getDocumentById(id);
  if (!doc || !doc.filePath) {
    const res = await prisma.documents.deleteMany({ where: { id } });
    return res.count > 0;
  }

  const { getStorage } = await import("@/lib/storage");
  const storage = getStorage();
  if (storage && doc.filePath.startsWith("http")) {
    try {
      await storage.delete(doc.filePath);
    } catch (err) {
      console.warn("Failed to delete file from storage:", err);
    }
  } else {
    const { unlink } = await import("fs/promises");
    const { join } = await import("path");
    try {
      const filePath = join(process.cwd(), "public", doc.filePath);
      await unlink(filePath);
    } catch (err) {
      console.warn("Failed to delete file:", err);
    }
  }

  const res = await prisma.documents.deleteMany({ where: { id } });
  return res.count > 0;
}
