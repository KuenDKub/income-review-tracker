-- Review Income & Tax Tracker — PostgreSQL schema
-- Run with: psql $DATABASE_URL -f src/lib/db/schema.sql

-- Review jobs (payer as text; status for workflow)
CREATE TABLE IF NOT EXISTS review_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_name TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  received_date DATE,
  review_deadline DATE,
  publish_date DATE,
  payment_date DATE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_brother_job BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_jobs_payer_name ON review_jobs(payer_name);
CREATE INDEX IF NOT EXISTS idx_review_jobs_status ON review_jobs(status);
CREATE INDEX IF NOT EXISTS idx_review_jobs_received_date ON review_jobs(received_date);
CREATE INDEX IF NOT EXISTS idx_review_jobs_review_deadline ON review_jobs(review_deadline);
CREATE INDEX IF NOT EXISTS idx_review_jobs_publish_date ON review_jobs(publish_date);

-- Income (one per job or split by period)
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_job_id UUID NOT NULL REFERENCES review_jobs(id) ON DELETE CASCADE,
  gross_amount DECIMAL(15,2) NOT NULL,
  withholding_rate DECIMAL(5,2) NOT NULL DEFAULT 3,
  withholding_amount DECIMAL(15,2) NOT NULL,
  net_amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_income_review_job_id ON income(review_job_id);
CREATE INDEX IF NOT EXISTS idx_income_payment_date ON income(payment_date);

-- Track whether the 50 ทวิ withholding-tax certificate has been received from
-- the payer (needed to file PND). Additive + idempotent for the prod DB.
ALTER TABLE income ADD COLUMN IF NOT EXISTS withholding_cert_received BOOLEAN NOT NULL DEFAULT false;

-- Documents / notes for Thai tax filing
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_job_id UUID REFERENCES review_jobs(id) ON DELETE CASCADE,
  income_id UUID REFERENCES income(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT documents_ref_check CHECK (review_job_id IS NOT NULL OR income_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_documents_review_job_id ON documents(review_job_id);
CREATE INDEX IF NOT EXISTS idx_documents_income_id ON documents(income_id);

-- Calendar notes (free-form notes per date, optionally linked to a review job)
CREATE TABLE IF NOT EXISTS calendar_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_date DATE NOT NULL,
  review_job_id UUID REFERENCES review_jobs(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_notes_date ON calendar_notes(note_date);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_review_job_id ON calendar_notes(review_job_id);

-- Rate card: published per-deliverable pricing for the media kit. One row per
-- (platform, content_type) combination the creator wants to advertise. Prices
-- are seeded from past-deal averages but are manually overridable.
CREATE TABLE IF NOT EXISTS rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL,
  price DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rate_cards_platform_content_unique UNIQUE (platform, content_type)
);

CREATE INDEX IF NOT EXISTS idx_rate_cards_sort_order ON rate_cards(sort_order);

-- Creator profile for the public portfolio / media kit. Single-row table
-- (the app is single-user); `id` is a fixed sentinel so upserts are simple.
CREATE TABLE IF NOT EXISTS creator_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_name TEXT NOT NULL DEFAULT '',
  handle TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  contact_email TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
