/**
 * Payers API business logic. Route handlers parse request, validate with Zod, call here, serialize response.
 */

import { query } from "@/lib/db/client";
import {
  serializePayer,
  deserializePayerBody,
  type PayerRow,
  type PayerJson,
} from "@/lib/serializers/payerSerializer";
import type { PaginatedResult } from "@/lib/pagination";

export async function listPayers(opts?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResult<PayerJson>> {
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const search = (opts?.search ?? "").trim();

  const where: string[] = [];
  const values: unknown[] = [];
  if (search) {
    values.push(`%${search}%`);
    values.push(`%${search}%`);
    where.push(`(name ILIKE $${values.length - 1} OR tax_id ILIKE $${values.length})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRes = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM payers ${whereSql}`,
    values
  );
  const total = Number.parseInt(countRes.rows[0]?.total ?? "0", 10) || 0;

  values.push(pageSize);
  values.push(offset);
  const { rows } = await query<PayerRow>(
    `SELECT * FROM payers ${whereSql} ORDER BY name LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return {
    data: rows.map(serializePayer),
    total,
    page,
    pageSize,
  };
}

export async function getPayerById(id: string): Promise<PayerJson | null> {
  const { rows } = await query<PayerRow>("SELECT * FROM payers WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  return serializePayer(rows[0]);
}

export async function createPayer(body: {
  name: string;
  taxId?: string | null;
  contactEmail?: string | null;
}): Promise<PayerJson> {
  const { name, tax_id, contact_email } = deserializePayerBody(body);
  const { rows } = await query<PayerRow>(
    "INSERT INTO payers (name, tax_id, contact_email) VALUES ($1, $2, $3) RETURNING *",
    [name, tax_id, contact_email]
  );
  return serializePayer(rows[0]);
}

export async function updatePayer(
  id: string,
  body: Partial<{ name: string; taxId: string | null; contactEmail: string | null }>
): Promise<PayerJson | null> {
  const existing = await getPayerById(id);
  if (!existing) return null;
  const { name, tax_id, contact_email } = deserializePayerBody({
    name: body.name ?? existing.name,
    taxId: body.taxId ?? existing.taxId,
    contactEmail: body.contactEmail ?? existing.contactEmail,
  });
  const { rows } = await query<PayerRow>(
    "UPDATE payers SET name = $1, tax_id = $2, contact_email = $3 WHERE id = $4 RETURNING *",
    [name, tax_id, contact_email, id]
  );
  if (rows.length === 0) return null;
  return serializePayer(rows[0]);
}

export async function deletePayer(id: string): Promise<boolean> {
  const { rowCount } = await query("DELETE FROM payers WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
