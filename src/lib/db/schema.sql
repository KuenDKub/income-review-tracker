-- Review Income & Tax Tracker — PostgreSQL schema
-- Run with: psql $DATABASE_URL -f src/lib/db/schema.sql

-- Payers (brands / payers)
CREATE TABLE IF NOT EXISTS payers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Review jobs
CREATE TABLE IF NOT EXISTS review_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id UUID NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  job_date DATE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_jobs_payer_id ON review_jobs(payer_id);
CREATE INDEX IF NOT EXISTS idx_review_jobs_job_date ON review_jobs(job_date);

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

-- Withholding tax (optional separate table for per-payer/per-period tracking)
CREATE TABLE IF NOT EXISTS withholding_tax (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id UUID NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
  income_id UUID REFERENCES income(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  tax_period DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withholding_tax_payer_id ON withholding_tax(payer_id);
CREATE INDEX IF NOT EXISTS idx_withholding_tax_tax_period ON withholding_tax(tax_period);

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
