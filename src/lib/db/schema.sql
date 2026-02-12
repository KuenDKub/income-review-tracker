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
