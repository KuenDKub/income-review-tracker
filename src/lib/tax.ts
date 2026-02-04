/**
 * Reuse: Withholding tax (หักภาษี ณ ที่จ่าย) calculation.
 * TODO: Thailand - centralise rate rules and validate against Revenue Department guidelines (e.g. PND 50/53).
 * TODO: Apply official rounding (per RD rules) before storing withholding_amount.
 */

import { roundCurrency } from "./currency";

/**
 * Compute withholding amount from gross and rate.
 * TODO: Validate rate against Thai RD rules (e.g. 1%, 3%, 5% by income type).
 */
export function computeWithholding(grossAmount: number, ratePercent: number): number {
  const rate = ratePercent / 100;
  return roundCurrency(grossAmount * rate);
}

/**
 * Compute net amount (gross - withholding).
 */
export function computeNet(grossAmount: number, withholdingAmount: number): number {
  return roundCurrency(grossAmount - withholdingAmount);
}

/**
 * Given gross and rate, return { withholdingAmount, netAmount }.
 */
export function computeWithholdingAndNet(
  grossAmount: number,
  ratePercent: number
): { withholdingAmount: number; netAmount: number } {
  const withholdingAmount = computeWithholding(grossAmount, ratePercent);
  const netAmount = computeNet(grossAmount, withholdingAmount);
  return { withholdingAmount, netAmount };
}
