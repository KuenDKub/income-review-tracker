/**
 * Reuse: THB format and rounding. Used by controllers AND client display
 * components, so this file must stay free of server-only deps (no Prisma).
 *
 * Money is rounded half-up to 2 decimals (satang). This is the single rounding
 * helper for the app — do not reintroduce ad-hoc `Math.round(x*100)/100`, which
 * suffers binary-float drift (e.g. 70.285 -> 7028.4999… -> wrong).
 * NOTE: if the Revenue Department mandates a different satang rule for a given
 * PND form, encode it here so every caller picks it up.
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

/**
 * Round to 2 decimals (satang), half-up, without binary-float drift.
 *
 * Trick: re-parse the value through a decimal-string exponent shift. Parsing
 * "70.285e2" yields the correctly-rounded double 7028.5 (not 70.285_double * 100
 * = 7028.4999…), so Math.round then behaves as written.
 */
export function roundCurrency(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  const shifted = Number(`${amount}e2`);
  if (!Number.isFinite(shifted)) return Math.round(amount * 100) / 100; // extreme magnitudes
  return Number(`${Math.round(shifted)}e-2`);
}
