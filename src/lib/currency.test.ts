import { describe, it, expect } from "vitest";
import { roundCurrency, parseTHB } from "@/lib/currency";

describe("roundCurrency", () => {
  it("rounds half up at the satang", () => {
    expect(roundCurrency(1.005)).toBe(1.01); // naive Math.round(x*100)/100 gives 1.00
    expect(roundCurrency(70.285)).toBe(70.29); // classic binary-float drift case
    expect(roundCurrency(2.675)).toBe(2.68);
  });

  it("leaves already-2dp values untouched", () => {
    expect(roundCurrency(300)).toBe(300);
    expect(roundCurrency(9700.5)).toBe(9700.5);
    expect(roundCurrency(0)).toBe(0);
  });

  it("handles negatives and non-finite input", () => {
    expect(roundCurrency(-30.005)).toBe(-30); // half-up toward +inf, matches prior Math.round semantics
    expect(roundCurrency(Number.NaN)).toBe(0);
    expect(roundCurrency(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("parseTHB", () => {
  it("strips thousands separators", () => {
    expect(parseTHB("1,234.56")).toBe(1234.56);
    expect(parseTHB(42)).toBe(42);
    expect(parseTHB("not a number")).toBe(0);
  });
});
