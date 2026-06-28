import { describe, it, expect } from "vitest";
import { pickStable } from "@/lib/pickStable";

const pool = ["a", "b", "c", "d"] as const;

describe("pickStable", () => {
  it("is deterministic for the same key", () => {
    const a = pickStable(pool, "job-123");
    const b = pickStable(pool, "job-123");
    expect(a).toBe(b);
  });

  it("always returns a member of the pool", () => {
    for (const id of ["", "x", "job-1", "job-2", "a-very-long-id-9999", "🎯"]) {
      expect(pool).toContain(pickStable(pool, id));
    }
  });

  it("spreads different keys across the pool (not all identical)", () => {
    const ids = Array.from({ length: 50 }, (_, i) => `job-${i}`);
    const seen = new Set(ids.map((id) => pickStable(pool, id)));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("handles a single-element pool", () => {
    expect(pickStable(["only"], "anything")).toBe("only");
  });
});
