/**
 * Deterministically pick one element of `pool` from a stable string `key`,
 * using an FNV-1a-style hash. The same key always yields the same element, so
 * e.g. a given job's notification keeps the same phrasing across cron re-runs,
 * while different keys spread across the pool.
 */
export function pickStable<T>(pool: readonly T[], key: string): T {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return pool[Math.abs(h) % pool.length];
}
