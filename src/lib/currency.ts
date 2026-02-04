/**
 * Reuse: THB format and rounding. Used by controllers and display components.
 * TODO: Thailand - apply Revenue Department rounding rules for tax and amounts.
 */

const THB_LOCALE = "th-TH";

export function formatTHB(amount: number): string {
  return new Intl.NumberFormat(THB_LOCALE, {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseTHB(value: string | number): number {
  if (typeof value === "number") return value;
  const cleaned = value.replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

/** Round to 2 decimal places (for currency). TODO: Use RD rounding rules for tax. */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
