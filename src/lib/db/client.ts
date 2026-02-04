import { Pool, type PoolClient } from "pg";

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

function getPool(): Pool {
  if (globalForDb.pool) return globalForDb.pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool;
  }
  return pool;
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

export async function query<T = unknown>(
  text: string,
  values?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const result = await getPool().query(text, values);
  return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
}
