"use client";

import { useCallback, useEffect, useState } from "react";

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
  socialLinks: Array<{ imageUrl?: string; label: string; url: string }>;
  isPublic: boolean;
};

const DEFAULT_PROFILE: CreatorProfile = {
  creatorName: "",
  handle: "",
  tagline: "",
  contactEmail: null,
  avatarUrl: null,
  coverUrl: null,
  rateCardBgUrl: null,
  contactTitle: "",
  contactHint: "",
  socialLinks: [],
  isPublic: true,
};

/**
 * Loads and persists the single creator profile (DB-backed via /api/profile).
 * `update` patches local state immediately; `save` flushes to the server.
 */
export function useCreatorProfile() {
  const [profile, setProfile] = useState<CreatorProfile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((json: { data: CreatorProfile }) => setProfile({ ...DEFAULT_PROFILE, ...json.data }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((patch: Partial<CreatorProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  /** Persist the given profile (defaults to current state) to the server. */
  const save = useCallback(async (value: CreatorProfile) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      if (!res.ok) throw new Error("save failed");
      return true;
    } catch {
      return false;
    }
  }, []);

  return { profile, loaded, update, save };
}
