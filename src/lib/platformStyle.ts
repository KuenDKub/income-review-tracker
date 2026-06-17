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

/**
 * Outline variant — brand-coloured border + brand text on a light tint of the
 * same colour. Pairs with <PlatformIcon /> for an airy, on-brand pill.
 */
export function platformOutlineClass(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key.includes("tiktok")) return "border-[#010101] bg-[#F2F2F2] text-[#010101]";
  if (key.includes("instagram") || key === "ig")
    return "border-[#d62976] bg-[#FCEAF1] text-[#C1306C]";
  if (key.includes("facebook") || key === "fb")
    return "border-[#1877F2] bg-[#E8F1FE] text-[#1877F2]";
  if (key.includes("youtube") || key === "yt")
    return "border-[#FF0000] bg-[#FFEAEA] text-[#E60000]";
  if (key.includes("lemon")) return "border-[#E6BF00] bg-[#FFF7CC] text-[#8A6D00]";
  if (key.includes("line")) return "border-[#06C755] bg-[#E6F8EE] text-[#06A848]";
  if (key.includes("twitter") || key === "x")
    return "border-[#0F1419] bg-[#ECEDEE] text-[#0F1419]";
  // Default: soft rose, matches the portfolio canvas.
  return "border-rose-300 bg-rose-50 text-rose-500";
}
