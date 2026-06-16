/**
 * Brand-correct pill colors for a content platform, keyed by a loose match on
 * the platform name (so "TikTok", "tiktok", "Tik Tok" all resolve the same).
 * Returns Tailwind classes for background/text/border; unknown platforms fall
 * back to the portfolio's soft rose theme.
 */
export function platformBadgeClass(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key.includes("tiktok")) return "border-transparent bg-[#010101] text-white";
  if (key.includes("instagram") || key === "ig")
    return "border-transparent bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#962fbf] text-white";
  if (key.includes("facebook") || key === "fb") return "border-transparent bg-[#1877F2] text-white";
  if (key.includes("youtube") || key === "yt") return "border-transparent bg-[#FF0000] text-white";
  if (key.includes("lemon")) return "border-transparent bg-[#FFD400] text-[#3A2A00]";
  if (key.includes("line")) return "border-transparent bg-[#06C755] text-white";
  if (key.includes("twitter") || key === "x") return "border-transparent bg-[#0F1419] text-white";
  // Default: soft rose, matches the portfolio canvas.
  return "border-rose-200/70 bg-white/70 text-[#8A5A72]";
}
