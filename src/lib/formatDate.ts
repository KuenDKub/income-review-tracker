/**
 * Thai short month names (abbreviated).
 */
const THAI_SHORT_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/**
 * Format an ISO date string (YYYY-MM-DD) to Thai display format: "1 ม.ค. 69"
 * (day, short Thai month, 2-digit Buddhist year).
 * Returns empty string or fallback for invalid/empty input.
 */
export function formatDateThai(
  isoDate: string | null | undefined,
  fallback = "—"
): string {
  const s = typeof isoDate === "string" ? isoDate.trim() : "";
  if (!s) return fallback;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return fallback;
  const [, y, m, d] = match;
  const monthIndex = parseInt(m, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return fallback;
  const dayNum = parseInt(d, 10);
  if (dayNum < 1 || dayNum > 31) return fallback;
  const yearAd = parseInt(y, 10);
  const yearBe = yearAd + 543; // Buddhist era
  const yearShort = String(yearBe).slice(-2);
  return `${dayNum} ${THAI_SHORT_MONTHS[monthIndex]} ${yearShort}`;
}

/**
 * Parse YYYY-MM-DD to local date (midnight). Returns null if invalid.
 */
function parseLocalDate(isoDate: string | null | undefined): Date | null {
  const s = typeof isoDate === "string" ? isoDate.trim() : "";
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Today at midnight in local time (date only, no time).
 */
function todayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * True when the date is within `withinDays` days from today (inclusive of today and past).
 * Default: within 3 days. Used to highlight "near review deadline".
 */
export function isNearReviewDeadline(
  isoDate: string | null | undefined,
  withinDays = 3
): boolean {
  const d = parseLocalDate(isoDate);
  if (!d) return false;
  const today = todayLocal();
  const diffMs = d.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return diffDays >= -withinDays && diffDays <= withinDays;
}

/**
 * True when the date is today or in the past ("already published").
 */
export function isPublishDatePassed(
  isoDate: string | null | undefined
): boolean {
  const d = parseLocalDate(isoDate);
  if (!d) return false;
  const today = todayLocal();
  return d.getTime() <= today.getTime();
}
