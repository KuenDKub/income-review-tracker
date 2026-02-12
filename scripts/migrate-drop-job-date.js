/**
 * Migration: Drop job_date from review_jobs.
 * Optional: copy job_date -> received_date when received_date is NULL.
 * Run with: node scripts/migrate-drop-job-date.js
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const hasJobDate = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'review_jobs' AND column_name = 'job_date'`
    );

    if (hasJobDate.rows.length === 0) {
      console.log("Column 'job_date' does not exist. Nothing to do.");
      await client.query("ROLLBACK");
      return;
    }

    const hasReceivedDate = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'review_jobs' AND column_name = 'received_date'`
    );
    if (hasReceivedDate.rows.length > 0) {
      console.log("Copying job_date -> received_date where received_date is NULL...");
      await client.query(
        `UPDATE review_jobs SET received_date = job_date WHERE received_date IS NULL`
      );
    }

    console.log("Dropping index idx_review_jobs_job_date (if exists)...");
    await client.query(`DROP INDEX IF EXISTS idx_review_jobs_job_date`);

    console.log("Dropping column job_date...");
    await client.query(`ALTER TABLE review_jobs DROP COLUMN IF EXISTS job_date`);

    await client.query("COMMIT");
    console.log("Migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });

