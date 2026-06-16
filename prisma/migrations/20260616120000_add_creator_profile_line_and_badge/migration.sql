-- Editable LINE contact (id + add-friend link) and an optional hero badge override.
ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "line_contact" TEXT NOT NULL DEFAULT '';
ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "line_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "badge_label" TEXT NOT NULL DEFAULT '';

-- Seed the current LINE contact onto the existing single profile row.
UPDATE "creator_profile"
SET
  "line_contact" = 'francfoil19',
  "line_url" = 'https://line.me/ti/p/LEa7H7NTXB',
  "updated_at" = now()
WHERE NULLIF(trim("line_url"), '') IS NULL;
