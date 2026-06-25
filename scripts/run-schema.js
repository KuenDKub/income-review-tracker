/**
 * Run PostgreSQL schema (src/lib/db/schema.sql). Requires DATABASE_URL in .env or env.
 * Usage: npm run db:migrate
 *
 * SAFETY: this runs against REAL prod. Two guards before anything touches the DB:
 *   1. Destructive-statement scan — refuses to run if schema.sql contains
 *      DROP TABLE/COLUMN, TRUNCATE, ALTER ... DROP, or DELETE without WHERE,
 *      unless you pass --allow-destructive (an explicit, deliberate override).
 *   2. Single transaction — the whole file is wrapped in BEGIN/COMMIT so a
 *      failure rolls everything back instead of leaving prod half-migrated.
 * Schema must stay additive + idempotent (CREATE/ALTER ... IF NOT EXISTS).
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

const allowDestructive = process.argv.includes("--allow-destructive");

const schemaPath = join(__dirname, "../src/lib/db/schema.sql");
const sql = readFileSync(schemaPath, "utf8");

/** Strip comments and string literals so keyword matching can't false-positive. */
function stripNoise(input) {
  return input
    .replace(/--[^\n]*/g, " ") // line comments
    .replace(/\/\*[\s\S]*?\*\//g, " ") // block comments
    .replace(/'(?:[^']|'')*'/g, " '' ") // single-quoted literals
    .replace(/\$\$[\s\S]*?\$\$/g, " $$ "); // dollar-quoted bodies
}

/** Return a list of destructive statements found (empty = safe). */
function findDestructive(rawSql) {
  const cleaned = stripNoise(rawSql);
  const hits = [];
  const patterns = [
    [/\bDROP\s+TABLE\b/i, "DROP TABLE"],
    [/\bDROP\s+COLUMN\b/i, "DROP COLUMN"],
    [/\bDROP\s+(SCHEMA|DATABASE|INDEX|CONSTRAINT|TYPE)\b/i, "DROP <object>"],
    [/\bTRUNCATE\b/i, "TRUNCATE"],
    [/\bALTER\s+TABLE\b[^;]*\bDROP\b/i, "ALTER TABLE ... DROP"],
    // DELETE that is not scoped by a WHERE clause before the next statement.
    [/\bDELETE\s+FROM\b(?:(?!\bWHERE\b)[\s\S])*?;/i, "DELETE without WHERE"],
  ];
  for (const [re, label] of patterns) {
    if (re.test(cleaned)) hits.push(label);
  }
  return hits;
}

const destructive = findDestructive(sql);
if (destructive.length > 0 && !allowDestructive) {
  console.error(
    "\n🛑 Refusing to migrate: schema.sql contains destructive statements:\n" +
      destructive.map((d) => `   - ${d}`).join("\n") +
      "\n\nThis runs against REAL prod data. If this is truly intended, re-run with:\n" +
      "   npm run db:migrate -- --allow-destructive\n"
  );
  process.exit(1);
}
if (destructive.length > 0 && allowDestructive) {
  console.warn(
    "⚠️  --allow-destructive set; applying destructive statements:",
    destructive.join(", ")
  );
}

const pool = new Pool({ connectionString });

(async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Schema applied successfully (committed in one transaction)");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
      console.error("Rolled back — no changes were applied.");
    } catch {
      // ignore rollback failure; original error is what matters
    }
    console.error("Schema migration failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
