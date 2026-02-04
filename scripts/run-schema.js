/**
 * Run PostgreSQL schema (src/lib/db/schema.sql). Requires DATABASE_URL in .env or env.
 * Usage: npm run db:migrate
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync } = require("fs");
const { join } = require("path");
const { Pool } = require("pg");

require("dotenv").config({ path: join(__dirname, "..", ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const schemaPath = join(__dirname, "../src/lib/db/schema.sql");
const sql = readFileSync(schemaPath, "utf8");

const pool = new Pool({ connectionString });

pool
  .query(sql)
  .then(() => {
    console.log("Schema applied successfully");
    pool.end();
  })
  .catch((err) => {
    console.error("Schema migration failed:", err);
    pool.end();
    process.exit(1);
  });
