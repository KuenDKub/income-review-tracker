/**
 * Migration: Add is_brother_job flag to review_jobs.
 * Run with: node scripts/migrate-add-is-brother-job.js
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

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

    const res = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'review_jobs' AND column_name = 'is_brother_job'`
    );
    if (res.rows.length > 0) {
      console.log("Column 'is_brother_job' already exists. Skipping.");
    } else {
      console.log("Adding column is_brother_job...");
      await client.query(
        "ALTER TABLE review_jobs ADD COLUMN is_brother_job BOOLEAN NOT NULL DEFAULT false"
      );
    }

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

