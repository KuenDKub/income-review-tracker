/**
 * Creator profile (single-row table) for the public portfolio and media kit.
 * The app is single-user, so there is at most one row; reads return defaults
 * when the row is absent.
 */

import { prisma } from "@/lib/db/prisma";

export type CreatorProfile = {
  creatorName: string;
  handle: string;
  tagline: string;
  contactEmail: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  rateCardBgUrl: string | null;
  contactTitle: string;
  contactHint: string;
  /** LINE contact shown on the public portfolio (id for display, url for the button). */
  lineContact: string;
  lineUrl: string;
  /** Optional override for the hero badge text; empty falls back to the default label. */
  badgeLabel: string;
  socialLinks: Array<{ imageUrl?: string; label: string; url: string }>;
  /** Invoice issuer ("from") details. */
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  bankDetails: string;
  isPublic: boolean;
};

const EMPTY: CreatorProfile = {
  creatorName: "",
  handle: "",
  tagline: "",
  contactEmail: null,
  avatarUrl: null,
  coverUrl: null,
  rateCardBgUrl: null,
  contactTitle: "",
  contactHint: "",
  lineContact: "",
  lineUrl: "",
  badgeLabel: "",
  socialLinks: [],
  legalName: "",
  taxId: "",
  address: "",
  phone: "",
  bankDetails: "",
  isPublic: true,
};

function socialImageFromLegacyIcon(icon: string | undefined, label: string): string | undefined {
  const key = (icon || label).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key.includes("tiktok")) return "/social/tiktok.svg";
  if (key.includes("instagram") || key === "ig") return "/social/instagram.svg";
  if (key.includes("facebook") || key === "fb") return "/social/facebook.svg";
  if (key.includes("youtube") || key === "yt") return "/social/youtube.svg";
  if (key.includes("lemon")) return "/social/lemon8.svg";
  return undefined;
}

function parseSocialLinks(value: string | null | undefined): CreatorProfile["socialLinks"] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        imageUrl:
          typeof item?.imageUrl === "string"
            ? item.imageUrl.trim()
            : socialImageFromLegacyIcon(
                typeof item?.icon === "string" ? item.icon.trim() : undefined,
                typeof item?.label === "string" ? item.label.trim() : "",
              ),
        label: typeof item?.label === "string" ? item.label.trim() : "",
        url: typeof item?.url === "string" ? item.url.trim() : "",
      }))
      .filter((item) => item.label && item.url)
      .slice(0, 8);
  } catch {
    return [];
  }
}

function serializeSocialLinks(value: CreatorProfile["socialLinks"] | undefined): string {
  if (!value) return "";
  return JSON.stringify(
    value
      .map((item) => ({
        imageUrl: item.imageUrl?.trim() || undefined,
        label: item.label.trim(),
        url: item.url.trim(),
      }))
      .filter((item) => item.label && item.url)
      .slice(0, 8),
  );
}

export async function getProfile(): Promise<CreatorProfile> {
  try {
    const row = await prisma.creator_profile.findFirst({
      orderBy: { updated_at: "desc" },
    });
    if (!row) return EMPTY;
    return {
      creatorName: row.creator_name,
      handle: row.handle,
      tagline: row.tagline,
      contactEmail: row.contact_email,
      avatarUrl: row.avatar_url,
      coverUrl: row.cover_url,
      rateCardBgUrl: row.rate_card_bg_url,
      contactTitle: row.contact_title ?? "",
      contactHint: row.contact_hint ?? "",
      lineContact: row.line_contact ?? "",
      lineUrl: row.line_url ?? "",
      badgeLabel: row.badge_label ?? "",
      socialLinks: parseSocialLinks(row.social_links),
      legalName: row.legal_name ?? "",
      taxId: row.tax_id ?? "",
      address: row.address ?? "",
      phone: row.phone ?? "",
      bankDetails: row.bank_details ?? "",
      isPublic: row.is_public,
    };
  } catch (err) {
    // Resilient to the table not existing yet (migration pending): the public
    // portfolio should still render with an empty profile rather than 500.
    console.warn("getProfile fell back to empty profile:", err);
    return EMPTY;
  }
}

export async function saveProfile(input: {
  creatorName?: string;
  handle?: string;
  tagline?: string;
  contactEmail?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  rateCardBgUrl?: string | null;
  contactTitle?: string;
  contactHint?: string;
  lineContact?: string;
  lineUrl?: string;
  badgeLabel?: string;
  socialLinks?: Array<{ imageUrl?: string; label: string; url: string }>;
  legalName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  bankDetails?: string;
  isPublic?: boolean;
}): Promise<CreatorProfile> {
  const existing = await prisma.creator_profile.findFirst({
    orderBy: { updated_at: "desc" },
  });

  const data = {
    creator_name: (input.creatorName ?? existing?.creator_name ?? "").trim(),
    handle: (input.handle ?? existing?.handle ?? "").trim().replace(/^@/, ""),
    tagline: (input.tagline ?? existing?.tagline ?? "").trim(),
    contact_email:
      input.contactEmail !== undefined
        ? input.contactEmail?.trim() || null
        : (existing?.contact_email ?? null),
    avatar_url:
      input.avatarUrl !== undefined
        ? input.avatarUrl || null
        : (existing?.avatar_url ?? null),
    cover_url:
      input.coverUrl !== undefined
        ? input.coverUrl || null
        : (existing?.cover_url ?? null),
    rate_card_bg_url:
      input.rateCardBgUrl !== undefined
        ? input.rateCardBgUrl || null
        : (existing?.rate_card_bg_url ?? null),
    contact_title: (input.contactTitle ?? existing?.contact_title ?? "").trim(),
    contact_hint: (input.contactHint ?? existing?.contact_hint ?? "").trim(),
    line_contact: (input.lineContact ?? existing?.line_contact ?? "").trim(),
    line_url: (input.lineUrl ?? existing?.line_url ?? "").trim(),
    badge_label: (input.badgeLabel ?? existing?.badge_label ?? "").trim(),
    social_links:
      input.socialLinks !== undefined
        ? serializeSocialLinks(input.socialLinks)
        : (existing?.social_links ?? ""),
    legal_name: (input.legalName ?? existing?.legal_name ?? "").trim(),
    tax_id: (input.taxId ?? existing?.tax_id ?? "").trim(),
    address: (input.address ?? existing?.address ?? "").trim(),
    phone: (input.phone ?? existing?.phone ?? "").trim(),
    bank_details: (input.bankDetails ?? existing?.bank_details ?? "").trim(),
    is_public: input.isPublic ?? existing?.is_public ?? true,
    updated_at: new Date(),
  };

  const row = existing
    ? await prisma.creator_profile.update({ where: { id: existing.id }, data })
    : await prisma.creator_profile.create({ data });

  return {
    creatorName: row.creator_name,
    handle: row.handle,
    tagline: row.tagline,
    contactEmail: row.contact_email,
    avatarUrl: row.avatar_url,
    coverUrl: row.cover_url,
    rateCardBgUrl: row.rate_card_bg_url,
    contactTitle: row.contact_title,
    contactHint: row.contact_hint,
    lineContact: row.line_contact ?? "",
    lineUrl: row.line_url ?? "",
    badgeLabel: row.badge_label ?? "",
    socialLinks: parseSocialLinks(row.social_links),
    legalName: row.legal_name ?? "",
    taxId: row.tax_id ?? "",
    address: row.address ?? "",
    phone: row.phone ?? "",
    bankDetails: row.bank_details ?? "",
    isPublic: row.is_public,
  };
}
