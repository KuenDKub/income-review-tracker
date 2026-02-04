/**
 * Documents API business logic.
 */

import { query } from "@/lib/db/client";

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
  const { rows } = await query<DocumentRow>(
    `INSERT INTO documents (review_job_id, income_id, kind, file_path, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [body.reviewJobId || null, body.incomeId || null, body.kind, body.filePath, body.notes || null]
  );
  return serializeDocument(rows[0]);
}

export async function listDocumentsByJobId(jobId: string): Promise<DocumentJson[]> {
  const { rows } = await query<DocumentRow>(
    "SELECT * FROM documents WHERE review_job_id = $1 ORDER BY created_at DESC",
    [jobId]
  );
  return rows.map(serializeDocument);
}

export async function getDocumentById(id: string): Promise<DocumentJson | null> {
  const { rows } = await query<DocumentRow>("SELECT * FROM documents WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  return serializeDocument(rows[0]);
}

export async function deleteDocument(id: string): Promise<boolean> {
  const doc = await getDocumentById(id);
  if (!doc || !doc.filePath) {
    const { rowCount } = await query("DELETE FROM documents WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
  }

  const { unlink } = await import("fs/promises");
  const { join } = await import("path");

  try {
    const filePath = join(process.cwd(), "public", doc.filePath);
    await unlink(filePath);
  } catch (err) {
    console.warn("Failed to delete file:", err);
  }

  const { rowCount } = await query("DELETE FROM documents WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
