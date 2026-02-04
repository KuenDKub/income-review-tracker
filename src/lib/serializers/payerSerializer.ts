/**
 * Serialize / deserialize Payer DB rows to API JSON shape.
 */

export type PayerRow = {
  id: string;
  name: string;
  tax_id: string | null;
  contact_email: string | null;
  created_at: Date;
};

export type PayerJson = {
  id: string;
  name: string;
  taxId: string | null;
  contactEmail: string | null;
  createdAt: string;
};

export function serializePayer(row: PayerRow): PayerJson {
  return {
    id: row.id,
    name: row.name,
    taxId: row.tax_id ?? null,
    contactEmail: row.contact_email ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export function deserializePayerBody(body: {
  name: string;
  taxId?: string | null;
  contactEmail?: string | null;
}): { name: string; tax_id: string | null; contact_email: string | null } {
  return {
    name: body.name,
    tax_id: body.taxId ?? null,
    contact_email: body.contactEmail ?? null,
  };
}
