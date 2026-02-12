/**
 * Migration: Replace payer_id (FK to payers) with payer_name TEXT and add status.
 * Drops withholding_tax and payers tables.
 * Run with: node scripts/migrate-payer-to-text.js
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

    const hasPayerId = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'review_jobs' AND column_name = 'payer_id'
    `);

    if (hasPayerId.rows.length === 0) {
      console.log("Column 'payer_id' does not exist. Schema may already be migrated.");
      await client.query("ROLLBACK");
      return;
    }

    // Add payer_name and status if not present
    const hasPayerName = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'review_jobs' AND column_name = 'payer_name'
    `);
    if (hasPayerName.rows.length === 0) {
      console.log("Adding payer_name column...");
      await client.query(`ALTER TABLE review_jobs ADD COLUMN payer_name TEXT`);
      console.log("Copying payer names from payers table...");
      await client.query(`
        UPDATE review_jobs r
        SET payer_name = p.name
        FROM payers p
        WHERE r.payer_id = p.id
      `);
    }

    const hasStatus = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'review_jobs' AND column_name = 'status'
    `);
    if (hasStatus.rows.length === 0) {
      console.log("Adding status column...");
      await client.query(`
        ALTER TABLE review_jobs
        ADD COLUMN status TEXT NOT NULL DEFAULT 'received'
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_review_jobs_status ON review_jobs(status)`);
    }

    // Drop FK from review_jobs to payers, then drop payer_id
    console.log("Dropping payer_id constraint and column...");
    await client.query(`
      ALTER TABLE review_jobs DROP CONSTRAINT IF EXISTS review_jobs_payer_id_fkey
    `);
    await client.query(`ALTER TABLE review_jobs DROP COLUMN IF EXISTS payer_id`);
    await client.query(`DROP INDEX IF EXISTS idx_review_jobs_payer_id`);
    if (hasPayerName.rows.length === 0) {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_review_jobs_payer_name ON review_jobs(payer_name)`);
    }

    // Drop withholding_tax table (references payers)
    console.log("Dropping withholding_tax table...");
    await client.query(`DROP TABLE IF EXISTS withholding_tax`);

    // Drop payers table
    console.log("Dropping payers table...");
    await client.query(`DROP TABLE IF EXISTS payers`);

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
