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
