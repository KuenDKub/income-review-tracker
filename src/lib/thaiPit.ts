/**
 * Thai personal income tax (PIT) — ภาษีเงินได้บุคคลธรรมดา.
 * Progressive brackets per Revenue Department (e.g. 2567).
 * Withholding (หัก ณ ที่จ่าย) is treated as prepayment; tax payable = liability - withholding.
 */

import { roundCurrency } from "./currency";

/** Thai PIT brackets (2567): limit (upper bound) and rate % for that bracket. */
const BRACKETS: Array<{ limit: number; ratePercent: number }> = [
  { limit: 150_000, ratePercent: 0 },
  { limit: 300_000, ratePercent: 5 },
  { limit: 500_000, ratePercent: 10 },
  { limit: 750_000, ratePercent: 15 },
  { limit: 1_000_000, ratePercent: 20 },
  { limit: 2_000_000, ratePercent: 25 },
  { limit: 5_000_000, ratePercent: 30 },
  { limit: Infinity, ratePercent: 35 },
];

/**
 * Compute tax liability from taxable income using Thai progressive brackets.
 */
export function computeThaiPITProgressive(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  const income = roundCurrency(taxableIncome);
  let prevLimit = 0;
  let tax = 0;
  for (const b of BRACKETS) {
    if (income <= prevLimit) break;
    const inBracket = Math.min(income, b.limit) - prevLimit;
    tax += roundCurrency(inBracket * (b.ratePercent / 100));
    prevLimit = b.limit;
    if (income <= b.limit) break;
  }
  return roundCurrency(tax);
}

export type TaxPayableResult = {
  taxableIncome: number;
  taxLiability: number;
  withholdingPaid: number;
  taxPayable: number;
  refund: boolean;
  refundAmount: number;
};

/**
 * Compute tax payable for the year.
 * taxableIncome = max(0, yearlyNet - personalAllowance)
 * taxLiability = progressive tax on taxableIncome
 * taxPayable = taxLiability - withholdingPaid (negative => refund)
 */
export function computeTaxPayable(
  yearlyNet: number,
  yearlyWithholding: number,
  personalAllowance: number = 60_000
): TaxPayableResult {
  const net = roundCurrency(yearlyNet);
  const withholding = roundCurrency(yearlyWithholding);
  const taxableIncome = Math.max(0, roundCurrency(net - personalAllowance));
  const taxLiability = computeThaiPITProgressive(taxableIncome);
  const taxPayableRaw = roundCurrency(taxLiability - withholding);
  const refund = taxPayableRaw < 0;
  const taxPayable = refund ? 0 : taxPayableRaw;
  const refundAmount = refund ? Math.abs(taxPayableRaw) : 0;
  return {
    taxableIncome,
    taxLiability,
    withholdingPaid: withholding,
    taxPayable,
    refund,
    refundAmount,
  };
}
