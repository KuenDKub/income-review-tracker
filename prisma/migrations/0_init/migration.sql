-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "calendar_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "note_date" DATE NOT NULL,
    "review_job_id" UUID,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_job_id" UUID,
    "income_id" UUID,
    "kind" TEXT NOT NULL,
    "file_path" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_job_id" UUID NOT NULL,
    "gross_amount" DECIMAL(15,2) NOT NULL,
    "withholding_rate" DECIMAL(5,2) NOT NULL DEFAULT 3,
    "withholding_amount" DECIMAL(15,2) NOT NULL,
    "net_amount" DECIMAL(15,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payer_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "received_date" DATE,
    "review_deadline" DATE,
    "publish_date" DATE,
    "payment_date" DATE,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_brother_job" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "review_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_calendar_notes_date" ON "calendar_notes"("note_date");

-- CreateIndex
CREATE INDEX "idx_calendar_notes_review_job_id" ON "calendar_notes"("review_job_id");

-- CreateIndex
CREATE INDEX "idx_documents_income_id" ON "documents"("income_id");

-- CreateIndex
CREATE INDEX "idx_documents_review_job_id" ON "documents"("review_job_id");

-- CreateIndex
CREATE INDEX "idx_income_payment_date" ON "income"("payment_date");

-- CreateIndex
CREATE INDEX "idx_income_review_job_id" ON "income"("review_job_id");

-- CreateIndex
CREATE INDEX "idx_review_jobs_payer_name" ON "review_jobs"("payer_name");

-- CreateIndex
CREATE INDEX "idx_review_jobs_publish_date" ON "review_jobs"("publish_date");

-- CreateIndex
CREATE INDEX "idx_review_jobs_received_date" ON "review_jobs"("received_date");

-- CreateIndex
CREATE INDEX "idx_review_jobs_review_deadline" ON "review_jobs"("review_deadline");

-- CreateIndex
CREATE INDEX "idx_review_jobs_status" ON "review_jobs"("status");

-- AddForeignKey
ALTER TABLE "calendar_notes" ADD CONSTRAINT "calendar_notes_review_job_id_fkey" FOREIGN KEY ("review_job_id") REFERENCES "review_jobs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_income_id_fkey" FOREIGN KEY ("income_id") REFERENCES "income"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_review_job_id_fkey" FOREIGN KEY ("review_job_id") REFERENCES "review_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_review_job_id_fkey" FOREIGN KEY ("review_job_id") REFERENCES "review_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

