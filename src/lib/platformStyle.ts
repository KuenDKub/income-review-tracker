/**
 * Single source of truth for the content platforms the app knows about.
 *
 * To support a NEW platform in the future, add one entry to `PLATFORMS` (place
 * it wherever it should appear in the display order). Everything below — sort
 * rank, filled-pill colours, outline colours and the legacy social-icon path —
 * derives from this list, and `<PlatformIcon />` keys its glyph off the same
 * `id`. So a new platform is a one-line change here, plus its SVG glyph in
 * platform-icon.tsx if you want a custom one.
 *
 * Matching is loose so "TikTok", "tiktok" and "Tik Tok" all resolve the same.
 * Short aliases (≤ 2 chars, e.g. "ig", "fb", "x") must match exactly so they
 * don't swallow unrelated names; longer tokens match as a substring.
 */
export type PlatformId =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "lemon"
  | "line"
  | "twitter"
  | "facebook";

type PlatformDef = {
  id: PlatformId;
  /** Tokens that identify this platform within a loosely-typed name. */
  match: string[];
  /** Solid brand pill (filled background). */
  badge: string;
  /** Outline pill — brand border + text on a light tint. */
  outline: string;
  /** Path to the standalone brand SVG, if one exists in /public/social. */
  socialIcon?: string;
};

// Canonical display order: TikTok first … Facebook last.
const PLATFORMS: PlatformDef[] = [
  {
    id: "tiktok",
    match: ["tiktok"],
    badge: "border-transparent bg-[#010101] text-white",
    outline: "border-[#010101] bg-[#F2F2F2] text-[#010101]",
    socialIcon: "/social/tiktok.svg",
  },
  {
    id: "instagram",
    match: ["instagram", "ig"],
    badge:
      "border-transparent bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#962fbf] text-white",
    outline: "border-[#d62976] bg-[#FCEAF1] text-[#C1306C]",
    socialIcon: "/social/instagram.svg",
  },
  {
    id: "youtube",
    match: ["youtube", "yt"],
    badge: "border-transparent bg-[#FF0000] text-white",
    outline: "border-[#FF0000] bg-[#FFEAEA] text-[#E60000]",
    socialIcon: "/social/youtube.svg",
  },
  {
    id: "lemon",
    match: ["lemon"],
    badge: "border-transparent bg-[#FFD400] text-[#3A2A00]",
    outline: "border-[#E6BF00] bg-[#FFF7CC] text-[#8A6D00]",
    socialIcon: "/social/lemon8.svg",
  },
  {
    id: "line",
    match: ["line"],
    badge: "border-transparent bg-[#06C755] text-white",
    outline: "border-[#06C755] bg-[#E6F8EE] text-[#06A848]",
  },
  {
    id: "twitter",
    match: ["twitter", "x"],
    badge: "border-transparent bg-[#0F1419] text-white",
    outline: "border-[#0F1419] bg-[#ECEDEE] text-[#0F1419]",
  },
  {
    id: "facebook",
    match: ["facebook", "fb"],
    badge: "border-transparent bg-[#1877F2] text-white",
    outline: "border-[#1877F2] bg-[#E8F1FE] text-[#1877F2]",
    socialIcon: "/social/facebook.svg",
  },
];

// Facebook is pinned to the very end of every sort, regardless of where it sits
// in the list above.
const ALWAYS_LAST: PlatformId = "facebook";

// Soft-rose fallbacks for platforms not in the registry — matches the portfolio canvas.
const DEFAULT_BADGE = "border-rose-200/70 bg-white/70 text-[#8A5A72]";
const DEFAULT_OUTLINE = "border-rose-300 bg-rose-50 text-rose-500";

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tokenMatches(key: string, token: string): boolean {
  return token.length <= 2 ? key === token : key.includes(token);
}

/** The registry entry a platform name resolves to, or undefined if unknown. */
function matchPlatform(name: string): PlatformDef | undefined {
  const key = normalizeKey(name);
  return PLATFORMS.find((p) => p.match.some((token) => tokenMatches(key, token)));
}

/** Canonical id for a platform name, or null if it isn't a known platform. */
export function platformId(name: string): PlatformId | null {
  return matchPlatform(name)?.id ?? null;
}

/**
 * Brand-correct filled pill colors for a content platform. Returns Tailwind
 * classes for background/text/border; unknown platforms fall back to soft rose.
 */
export function platformBadgeClass(name: string): string {
  return matchPlatform(name)?.badge ?? DEFAULT_BADGE;
}

/**
 * Outline variant — brand-coloured border + brand text on a light tint of the
 * same colour. Pairs with <PlatformIcon /> for an airy, on-brand pill.
 */
export function platformOutlineClass(name: string): string {
  return matchPlatform(name)?.outline ?? DEFAULT_OUTLINE;
}

/** Path to the standalone brand SVG for a platform, or undefined if none. */
export function platformSocialIcon(name: string): string | undefined {
  return matchPlatform(name)?.socialIcon;
}

/**
 * Display rank for a platform name. Lower sorts first. Order follows the
 * `PLATFORMS` list, except the always-last platform (Facebook), which is forced
 * to the very end, and unknown platforms, which slot in just before it.
 */
export function platformRank(name: string): number {
  const id = platformId(name);
  if (id === ALWAYS_LAST) return Number.MAX_SAFE_INTEGER; // always last
  const index = PLATFORMS.findIndex((p) => p.id === id);
  // Unknown platforms (index -1) sort after all known ones but before Facebook.
  return index >= 0 ? index : PLATFORMS.length;
}

/**
 * Sorts platform names into the canonical display order (TikTok → … → Facebook).
 * Returns a new array; ties fall back to alphabetical for stable output.
 */
export function sortPlatforms(list: string[]): string[] {
  return [...list].sort((a, b) => {
    const diff = platformRank(a) - platformRank(b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}
