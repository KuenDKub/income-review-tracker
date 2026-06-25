import { describe, it, expect } from "vitest";
import {
  computeWithholding,
  computeNet,
  computeWithholdingAndNet,
} from "@/lib/tax";

describe("computeWithholding", () => {
  it("applies the default 3% case", () => {
    expect(computeWithholding(10000, 3)).toBe(300);
    expect(computeWithholding(10000, 3)).toBe(300);
  });

  it("rounds the withholding amount to satang (no float drift)", () => {
    // 1000.10 * 3% = 30.003 -> 30.00
    expect(computeWithholding(1000.1, 3)).toBe(30);
    // 9.95 * 3% = 0.2985 -> 0.30
    expect(computeWithholding(9.95, 3)).toBe(0.3);
    // 5% path
    expect(computeWithholding(333.33, 5)).toBe(16.67); // 16.6665 -> 16.67
  });
});

describe("computeNet", () => {
  it("subtracts withholding and rounds", () => {
    expect(computeNet(10000, 300)).toBe(9700);
    expect(computeNet(9.95, 0.3)).toBe(9.65);
  });
});

describe("computeWithholdingAndNet", () => {
  it("returns consistent rounded withholding + net", () => {
    expect(computeWithholdingAndNet(10000, 3)).toEqual({
      withholdingAmount: 300,
      netAmount: 9700,
    });
    const r = computeWithholdingAndNet(333.33, 5);
    expect(r.withholdingAmount).toBe(16.67);
    expect(r.netAmount).toBe(316.66); // 333.33 - 16.67
  });

  it("a 0% rate leaves the full amount net", () => {
    expect(computeWithholdingAndNet(500, 0)).toEqual({
      withholdingAmount: 0,
      netAmount: 500,
    });
  });
});
