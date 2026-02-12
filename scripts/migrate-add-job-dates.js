/**
 * Migration: Add received_date, review_deadline, publish_date, payment_date to review_jobs.
 * Run with: node scripts/migrate-add-job-dates.js
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

const COLUMNS = [
  { name: "received_date", type: "DATE" },
  { name: "review_deadline", type: "DATE" },
  { name: "publish_date", type: "DATE" },
  { name: "payment_date", type: "DATE" },
];

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const col of COLUMNS) {
      const res = await client.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'review_jobs' AND column_name = $1`,
        [col.name]
      );
      if (res.rows.length > 0) {
        console.log(`Column '${col.name}' already exists. Skipping.`);
        continue;
      }
      console.log(`Adding column ${col.name}...`);
      await client.query(`ALTER TABLE review_jobs ADD COLUMN ${col.name} ${col.type}`);
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
