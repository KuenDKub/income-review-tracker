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
  contactTitle: string;
  contactHint: string;
  isPublic: boolean;
};

const EMPTY: CreatorProfile = {
  creatorName: "",
  handle: "",
  tagline: "",
  contactEmail: null,
  avatarUrl: null,
  coverUrl: null,
  contactTitle: "",
  contactHint: "",
  isPublic: true,
};

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
      contactTitle: row.contact_title ?? "",
      contactHint: row.contact_hint ?? "",
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
  contactTitle?: string;
  contactHint?: string;
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
    contact_title: (input.contactTitle ?? existing?.contact_title ?? "").trim(),
    contact_hint: (input.contactHint ?? existing?.contact_hint ?? "").trim(),
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
    contactTitle: row.contact_title,
    contactHint: row.contact_hint,
    isPublic: row.is_public,
  };
}
