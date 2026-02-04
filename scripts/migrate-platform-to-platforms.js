/**
 * Migration: Convert platform TEXT to platforms TEXT[]
 * Run with: node scripts/migrate-platform-to-platforms.js
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

    // Check if platforms column already exists
    const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'review_jobs' AND column_name = 'platforms'
    `);

    if (checkRes.rows.length > 0) {
      console.log("Column 'platforms' already exists. Migration may have already been run.");
      await client.query("ROLLBACK");
      return;
    }

    // Check if platform column exists
    const checkPlatformRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'review_jobs' AND column_name = 'platform'
    `);

    if (checkPlatformRes.rows.length === 0) {
      console.log("Column 'platform' does not exist. Nothing to migrate.");
      await client.query("ROLLBACK");
      return;
    }

    // Add platforms column (nullable first)
    console.log("Adding platforms column...");
    await client.query(`
      ALTER TABLE review_jobs 
      ADD COLUMN platforms TEXT[]
    `);

    // Update existing rows: convert platform to platforms array
    console.log("Updating existing data...");
    await client.query(`
      UPDATE review_jobs 
      SET platforms = ARRAY[platform]::TEXT[]
      WHERE platforms IS NULL
    `);

    // Set NOT NULL constraint
    console.log("Setting NOT NULL constraint...");
    await client.query(`
      ALTER TABLE review_jobs 
      ALTER COLUMN platforms SET NOT NULL,
      ALTER COLUMN platforms SET DEFAULT '{}'
    `);

    // Drop old platform column
    console.log("Dropping old platform column...");
    await client.query(`
      ALTER TABLE review_jobs 
      DROP COLUMN platform
    `);

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
