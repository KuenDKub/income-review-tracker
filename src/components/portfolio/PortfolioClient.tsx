"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ui/useConfirm";
import { cn } from "@/lib/utils";
import { platformBadgeClass } from "@/lib/platformStyle";

type RateCard = {
  id: string;
  platform: string;
  contentType: string;
  price: number;
  currency: string;
  notes: string | null;
};
type RateRow = {
  platform: string;
  contentType: string;
  price: number;
  currency: string;
  notes: string | null;
};
type Suggestion = {
  platform: string;
  contentType: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  last: number;
  currency: string;
};
type Collab = {
  name: string;
  dealCount: number;
  platforms: string[];
  contentTypes: string[];
  imageUrl: string | null;
  showOnPortfolio: boolean;
};
type Work = {
  id: string;
  imageUrl: string;
  title: string;
  payerName: string | null;
  platforms: string[];
  contentType: string;
};
type Stats = {
  totalDeals: number;
  brandCount: number;
  platforms: string[];
  firstDealYear: number | null;
};
type PortfolioData = {
  stats: Stats;
  rates: RateCard[];
  collaborations: Collab[];
  gallery: Work[];
  platforms: string[];
};

function monogram(name: string): string {
  const s = name.trim();
  if (!s) return "★";
  return s.slice(0, 1).toUpperCase();
}

export function PortfolioClient() {
  const t = useTranslations("portfolio");
  const tRate = useTranslations("rateCard");
  const tBilling = useTranslations("billing");
  const { confirm, confirmDialog } = useConfirm();

  const { profile, update: updateProfile, save: saveProfile } = useCreatorProfile();

  const [data, setData] = useState<PortfolioData | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Editable rate card + price suggestions (merged from the old rate-card page).
  const [rateRows, setRateRows] = useState<RateRow[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [savingRates, setSavingRates] = useState(false);

  // Inline editing for the contact CTA card.
  const [editingContact, setEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  // Snapshot to restore the contact fields if the user cancels the inline edit.
  const [contactSnapshot, setContactSnapshot] =
    useState<{ title: string; hint: string; lineContact: string; lineUrl: string } | null>(null);

  function startEditContact() {
    setContactSnapshot({
      title: profile.contactTitle,
      hint: profile.contactHint,
      lineContact: profile.lineContact,
      lineUrl: profile.lineUrl,
    });
    setEditingContact(true);
  }

  function cancelEditContact() {
    if (contactSnapshot) {
      updateProfile({
        contactTitle: contactSnapshot.title,
        contactHint: contactSnapshot.hint,
        lineContact: contactSnapshot.lineContact,
        lineUrl: contactSnapshot.lineUrl,
      });
    }
    setEditingContact(false);
  }

  function addSocialLink() {
    updateProfile({
      socialLinks: [...profile.socialLinks, { imageUrl: "", label: "", url: "" }],
    });
  }

  function updateSocialLink(index: number, patch: Partial<{ imageUrl?: string; label: string; url: string }>) {
    updateProfile({
      socialLinks: profile.socialLinks.map((link, i) =>
        i === index ? { ...link, ...patch } : link,
      ),
    });
  }

  function removeSocialLink(index: number) {
    updateProfile({
      socialLinks: profile.socialLinks.filter((_, i) => i !== index),
    });
  }

  // Brand detail dialog state.
  const [activeBrand, setActiveBrand] = useState<Collab | null>(null);

  // Add-work uploader state.
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; payerName: string | null }>>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addJobId, setAddJobId] = useState<string>("");
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  // Inline "add work" uploader inside the brand modal — uploads straight to the
  // brand without leaving the modal or opening another dialog.
  const brandWorkInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBrandWork, setUploadingBrandWork] = useState(false);

  // Profile photo / cover uploader state.
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const rateCardBgInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingRateCardBg, setUploadingRateCardBg] = useState(false);

  // Upload a single image and persist it onto the profile (avatar or cover).
  const uploadProfileImage = useCallback(
    async (kind: "avatar" | "cover", file: File | undefined | null) => {
      if (!file) return;
      const setBusy = kind === "avatar" ? setUploadingAvatar : setUploadingCover;
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error("upload failed");
        const { filePath } = await up.json();
        const next = {
          ...profile,
          ...(kind === "avatar" ? { avatarUrl: filePath } : { coverUrl: filePath }),
        };
        updateProfile(kind === "avatar" ? { avatarUrl: filePath } : { coverUrl: filePath });
        const ok = await saveProfile(next);
        if (!ok) throw new Error("save failed");
        toast.success(t("photoSaved"));
      } catch {
        toast.error(t("photoError"));
      } finally {
        setBusy(false);
      }
    },
    [profile, updateProfile, saveProfile, t],
  );

  const uploadRateCardBg = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setUploadingRateCardBg(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error("upload failed");
        const { filePath } = await up.json();
        const next = { ...profile, rateCardBgUrl: filePath };
        updateProfile({ rateCardBgUrl: filePath });
        const ok = await saveProfile(next);
        if (!ok) throw new Error("save failed");
        toast.success(t("rateCardBgSaved"));
      } catch {
        toast.error(t("photoError"));
      } finally {
        setUploadingRateCardBg(false);
      }
    },
    [profile, updateProfile, saveProfile, t],
  );

  const removeProfileImage = useCallback(
    async (kind: "avatar" | "cover") => {
      const next = {
        ...profile,
        ...(kind === "avatar" ? { avatarUrl: null } : { coverUrl: null }),
      };
      updateProfile(kind === "avatar" ? { avatarUrl: null } : { coverUrl: null });
      const ok = await saveProfile(next);
      if (ok) toast.success(t("photoSaved"));
      else toast.error(t("photoError"));
    },
    [profile, updateProfile, saveProfile, t],
  );

  const removeRateCardBg = useCallback(async () => {
    const next = { ...profile, rateCardBgUrl: null };
    updateProfile({ rateCardBgUrl: null });
    const ok = await saveProfile(next);
    if (ok) toast.success(t("rateCardBgSaved"));
    else toast.error(t("photoError"));
  }, [profile, updateProfile, saveProfile, t]);

  const loadPortfolio = useCallback(() => {
    // includeHidden: this is the owner edit page, so show hidden brands too
    // (with their toggle off) instead of dropping them like the public page.
    return fetch("/api/portfolio?includeHidden=1")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { data: PortfolioData }) => setData(json.data))
      .catch(() => setError(true));
  }, []);

  const toggleBrand = useCallback(
    async (name: string, show: boolean) => {
      const apply = (value: boolean) =>
        setData((prev) =>
          prev
            ? {
                ...prev,
                collaborations: prev.collaborations.map((c) =>
                  c.name === name ? { ...c, showOnPortfolio: value } : c,
                ),
              }
            : prev,
        );
      apply(show); // optimistic
      try {
        const res = await fetch("/api/portfolio", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payerName: name, showOnPortfolio: show }),
        });
        if (!res.ok) throw new Error();
        toast.success(show ? t("brandShown") : t("brandHidden"));
      } catch {
        apply(!show); // revert
        toast.error(t("brandToggleError"));
      }
    },
    [t],
  );

  const loadRateCards = useCallback(() => {
    return fetch("/api/rate-cards")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { data: { rateCards: RateRow[]; suggestions: Suggestion[] } }) => {
        setRateRows(json.data.rateCards);
        setSuggestions(json.data.suggestions);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    loadPortfolio();
    loadRateCards();
  }, [loadPortfolio, loadRateCards]);

  function addRateRow(seed?: Partial<RateRow>) {
    setRateRows((prev) => [
      ...prev,
      {
        platform: seed?.platform ?? "",
        contentType: seed?.contentType ?? "",
        price: seed?.price ?? 0,
        currency: seed?.currency ?? "THB",
        notes: seed?.notes ?? null,
      },
    ]);
  }

  function updateRateRow(index: number, patch: Partial<RateRow>) {
    setRateRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRateRow(index: number) {
    setRateRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveRates() {
    setSavingRates(true);
    try {
      const res = await fetch("/api/rate-cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rateRows }),
      });
      if (!res.ok) throw new Error("save failed");
      const json: { data: { rateCards: RateRow[] } } = await res.json();
      setRateRows(json.data.rateCards);
      toast.success(tRate("saved"));
    } catch {
      toast.error(tRate("saveError"));
    } finally {
      setSavingRates(false);
    }
  }

  useEffect(() => {
    // Jobs are needed by both the add-work dialog and the brand modal's inline
    // uploader, so load them as soon as either opens.
    if ((!addOpen && !activeBrand) || jobs.length > 0) return;
    fetch("/api/jobs?pageSize=100")
      .then((r) => r.json())
      .then((json: { data?: Array<{ id: string; title: string; payerName: string | null }> }) =>
        setJobs(
          (json.data ?? []).map((j) => ({ id: j.id, title: j.title, payerName: j.payerName })),
        ),
      )
      .catch(() => setJobs([]));
  }, [addOpen, activeBrand, jobs.length]);

  async function uploadWork() {
    if (!addJobId || addFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of addFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error("upload failed");
        const upJson = await up.json();
        const doc = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewJobId: addJobId,
            kind: "portfolio",
            filePath: upJson.filePath,
          }),
        });
        if (!doc.ok) throw new Error("save failed");
      }
      toast.success(t("workAdded"));
      setAddFiles([]);
      setAddOpen(false);
      await loadPortfolio();
    } catch {
      toast.error(t("workAddError"));
    } finally {
      setUploading(false);
    }
  }

  // Upload one or more images straight onto a brand from inside the brand modal.
  // The work is attached to a job belonging to that brand so it groups correctly.
  async function uploadBrandWork(brandName: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    const jobId = jobs.find((j) => j.payerName === brandName)?.id;
    if (!jobId) {
      toast.error(t("workAddError"));
      return;
    }
    setUploadingBrandWork(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error("upload failed");
        const upJson = await up.json();
        const doc = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewJobId: jobId,
            kind: "portfolio",
            filePath: upJson.filePath,
          }),
        });
        if (!doc.ok) throw new Error("save failed");
      }
      toast.success(t("workAdded"));
      await loadPortfolio();
    } catch {
      toast.error(t("workAddError"));
    } finally {
      setUploadingBrandWork(false);
    }
  }

  async function deleteWork(id: string) {
    if (!(await confirm({ description: t("confirmRemoveWork") }))) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setData((prev) =>
        prev ? { ...prev, gallery: prev.gallery.filter((w) => w.id !== id) } : prev,
      );
      toast.success(t("workRemoved"));
    } catch {
      toast.error(t("workRemoveError"));
    }
  }

  async function saveAndCloseProfile() {
    setSavingProfile(true);
    const ok = await saveProfile(profile);
    setSavingProfile(false);
    if (ok) {
      setEditing(false);
      toast.success(t("profileSaved"));
      await loadPortfolio();
    } else {
      toast.error(t("profileSaveError"));
    }
  }

  async function saveContact() {
    setSavingContact(true);
    const ok = await saveProfile(profile);
    setSavingContact(false);
    if (ok) {
      setEditingContact(false);
      toast.success(t("profileSaved"));
    } else {
      toast.error(t("profileSaveError"));
    }
  }

  async function saveSocialLinks() {
    setSavingSocial(true);
    const ok = await saveProfile({
      ...profile,
      socialLinks: profile.socialLinks.filter((link) => link.label.trim() && link.url.trim()),
    });
    setSavingSocial(false);
    if (ok) {
      updateProfile({
        socialLinks: profile.socialLinks.filter((link) => link.label.trim() && link.url.trim()),
      });
      toast.success(t("profileSaved"));
    } else {
      toast.error(t("profileSaveError"));
    }
  }

  async function saveBilling() {
    setSavingBilling(true);
    const ok = await saveProfile(profile);
    setSavingBilling(false);
    toast[ok ? "success" : "error"](ok ? t("profileSaved") : t("profileSaveError"));
  }

  async function copyShareLink() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/portfolio` : "/portfolio";
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("linkCopyError"));
    }
  }

  const handleAt = profile.handle ? `@${profile.handle.replace(/^@/, "")}` : "";
  const displayName = profile.creatorName.trim() || profile.handle.trim() || t("creatorFallback");

  const filteredGallery = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.gallery;
    return data.gallery.filter((w) => w.platforms.includes(filter));
  }, [data, filter]);

  async function downloadMediaKit() {
    setDownloading(true);
    try {
      const res = await fetch("/api/rate-cards/media-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName: displayName,
          handle: handleAt,
          tagline: profile.tagline,
          filename: "media-kit.docx",
          labels: {
            rateCard: tRate("mediaKitRateCard"),
            deliverable: tRate("colDeliverable"),
            platform: tRate("colPlatform"),
            price: tRate("colPrice"),
            notes: tRate("colNotes"),
            dealsDone: tRate("statDeals"),
            brands: tRate("statBrands"),
            onPlatforms: tRate("statPlatforms"),
            since: tRate("since"),
            generatedNote: tRate("generatedNote"),
          },
        }),
      });
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "media-kit.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(tRate("mediaKitDownloaded"));
    } catch {
      toast.error(tRate("mediaKitError"));
    } finally {
      setDownloading(false);
    }
  }

  async function copyContact() {
    const value = handleAt || displayName;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-muted-foreground">
        {t("loadError")}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const { stats, collaborations } = data;
  const heroStats = [
    { icon: Briefcase, label: tRate("statDeals"), value: stats.totalDeals },
    { icon: Building2, label: tRate("statBrands"), value: stats.brandCount },
    { icon: Globe, label: tRate("statPlatforms"), value: stats.platforms.length },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden rounded-3xl border shadow-sm">
        {/* Cover banner */}
        <div className="relative h-32 w-full sm:h-44">
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.coverUrl}
              alt={t("coverPhoto")}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-gradient-to-br from-primary/30 via-fuchsia-400/20 to-violet-500/30" />
          )}
          {/* Cover controls */}
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60 disabled:opacity-60"
            >
              {uploadingCover ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ImageIcon className="size-3.5" />
              )}
              {profile.coverUrl ? t("changePhoto") : t("coverPhoto")}
            </button>
            {profile.coverUrl && !uploadingCover && (
              <button
                type="button"
                onClick={() => removeProfileImage("cover")}
                aria-label={t("removePhoto")}
                className="inline-flex cursor-pointer items-center rounded-full bg-black/45 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              uploadProfileImage("cover", e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        {/* Body */}
        <div className="relative bg-gradient-to-br from-primary/10 via-card to-violet-500/10 px-6 pb-6 sm:px-9 sm:pb-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 left-8 size-40 rounded-full bg-violet-500/20 blur-3xl"
          />

          <div className="relative flex flex-col gap-6">
            {/* Avatar (overlapping cover) + edit */}
            <div className="-mt-12 flex items-end justify-between sm:-mt-14">
              <div className="group relative shrink-0">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="size-24 rounded-2xl object-cover shadow-md ring-4 ring-card sm:size-28"
                  />
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-3xl font-bold text-primary-foreground shadow-md ring-4 ring-card sm:size-28 sm:text-4xl">
                    {monogram(displayName)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label={profile.avatarUrl ? t("changePhoto") : t("uploadPhoto")}
                  className="absolute -bottom-1 -right-1 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition-transform hover:scale-105 disabled:opacity-60"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    uploadProfileImage("avatar", e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setEditing((v) => !v)}
                aria-label={t("editProfile")}
              >
                <Pencil className="size-4" />
              </Button>
            </div>

            {/* Name + handle + tagline */}
            <div className="-mt-2 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-4xl">
                  {displayName}
                </h1>
                <BadgeCheck className="size-5 shrink-0 text-primary sm:size-6" />
              </div>
              {handleAt && (
                <p className="mt-0.5 text-sm font-semibold text-primary sm:text-base">{handleAt}</p>
              )}
              {profile.tagline ? (
                <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{profile.tagline}</p>
              ) : (
                <p className="mt-1.5 text-sm text-muted-foreground/70">{t("profileHint")}</p>
              )}
            </div>

          {editing && (
            <div className="grid gap-3 rounded-2xl border bg-card/70 p-4 backdrop-blur sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="pf-name">{tRate("creatorName")}</Label>
                <Input
                  id="pf-name"
                  value={profile.creatorName}
                  placeholder={tRate("creatorNamePlaceholder")}
                  onChange={(e) => updateProfile({ creatorName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-handle">{tRate("handle")}</Label>
                <Input
                  id="pf-handle"
                  value={profile.handle}
                  placeholder="francfoil"
                  onChange={(e) => updateProfile({ handle: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-tagline">{tRate("tagline")}</Label>
                <Input
                  id="pf-tagline"
                  value={profile.tagline}
                  placeholder={tRate("taglinePlaceholder")}
                  onChange={(e) => updateProfile({ tagline: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="pf-contact">{t("contactEmail")}</Label>
                <Input
                  id="pf-contact"
                  type="email"
                  value={profile.contactEmail ?? ""}
                  placeholder={t("contactEmailPlaceholder")}
                  onChange={(e) => updateProfile({ contactEmail: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="pf-badge">{t("badgeLabelLabel")}</Label>
                <Input
                  id="pf-badge"
                  value={profile.badgeLabel}
                  placeholder={t("badgeLabelPlaceholder")}
                  onChange={(e) => updateProfile({ badgeLabel: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{t("badgeLabelHint")}</p>
              </div>
              <div className="sm:col-span-3">
                <Button type="button" size="sm" onClick={saveAndCloseProfile} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {t("saveProfile")}
                </Button>
              </div>
            </div>
          )}

          {/* Platform pills */}
          {stats.platforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {stats.platforms.map((p) => (
                <span
                  key={p}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold",
                    platformBadgeClass(p),
                  )}
                >
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {heroStats.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-2xl border bg-card/60 p-3 text-center backdrop-blur sm:p-4"
              >
                <Icon className="mx-auto mb-1 size-4 text-primary" />
                <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">{value}</p>
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{label}</p>
              </div>
            ))}
          </div>

          {/* Share banner */}
          <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-card/60 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{t("shareHint")}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyShareLink}>
                {linkCopied ? <Check className="size-4 text-primary" /> : <LinkIcon className="size-4" />}
                {linkCopied ? t("linkCopiedShort") : t("copyLink")}
              </Button>
              <a
                href="/portfolio"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-primary/5"
              >
                <ExternalLink className="size-4" />
                {t("viewPublic")}
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={downloadMediaKit}
              disabled={downloading}
              className="flex-1 bg-gradient-to-r from-primary to-violet-500 sm:flex-none"
            >
              {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {tRate("downloadMediaKit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={copyContact}
              className="flex-1 sm:flex-none"
            >
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
              {copied ? t("contactCopied") : t("copyContact")}
            </Button>
          </div>
          </div>
        </div>
      </section>

      {/* ---------- COLLABORATIONS ---------- */}
      {collaborations.length > 0 && (
        <section className="space-y-4">
          <SectionHeading icon={Building2} title={t("collabsTitle")} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {collaborations.map((c) => (
              <Card
                key={c.name}
                className={cn(
                  "overflow-hidden rounded-2xl transition-shadow hover:shadow-md",
                  !c.showOnPortfolio && "opacity-55",
                )}
              >
                <CardContent className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => setActiveBrand(c)}
                    aria-label={t("viewBrand", { name: c.name })}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                  >
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        loading="lazy"
                        className="size-11 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 text-sm font-bold text-pink-500">
                        {monogram(c.name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("deals", { count: c.dealCount })}
                      </p>
                    </div>
                  </button>
                  <Switch
                    checked={c.showOnPortfolio}
                    onCheckedChange={(v) => toggleBrand(c.name, v)}
                    aria-label={t("showOnPortfolioBrand", { name: c.name })}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ---------- WORK GALLERY ---------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <SectionHeading icon={Sparkles} title={t("workTitle")} />
          <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <ImagePlus className="size-4" />
            {t("addWork")}
          </Button>
        </div>
        {data.platforms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              {t("all")}
            </FilterChip>
            {data.platforms.map((p) => (
              <FilterChip key={p} active={filter === p} onClick={() => setFilter(p)}>
                {p}
              </FilterChip>
            ))}
          </div>
        )}

        {filteredGallery.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">{t("noWork")}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <ImagePlus className="size-4" />
                {t("addWork")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
            {filteredGallery.map((w) => (
              <figure
                key={w.id}
                className="group relative break-inside-avoid overflow-hidden rounded-2xl border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.imageUrl}
                  alt={`${w.title}${w.payerName ? ` — ${w.payerName}` : ""}`}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <button
                  type="button"
                  onClick={() => deleteWork(w.id)}
                  aria-label={t("workRemove")}
                  className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white opacity-100 transition-opacity hover:bg-destructive group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:hover)]:opacity-0"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 opacity-100 transition-opacity duration-200 group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
                  <p className="truncate text-xs font-semibold text-white">{w.payerName ?? w.title}</p>
                  <p className="truncate text-[11px] text-white/80">
                    {[w.contentType, w.platforms.join(", ")].filter(Boolean).join(" · ")}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* ---------- ADD WORK DIALOG ---------- */}
      {/* ---------- BRAND DETAIL DIALOG ---------- */}
      <Dialog open={!!activeBrand} onOpenChange={(open) => !open && setActiveBrand(null)}>
        <DialogContent>
          {activeBrand && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {activeBrand.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeBrand.imageUrl}
                      alt={activeBrand.name}
                      className="size-12 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 text-base font-bold text-pink-500">
                      {monogram(activeBrand.name)}
                    </span>
                  )}
                  <div className="min-w-0 text-left">
                    <DialogTitle className="truncate">{activeBrand.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      {t("deals", { count: activeBrand.dealCount })}
                    </p>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-5">
                {activeBrand.platforms.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t("brandPlatforms")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {activeBrand.platforms.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {activeBrand.contentTypes.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t("brandContentTypes")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {activeBrand.contentTypes.map((ct) => (
                        <span
                          key={ct}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {ct}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{t("brandWork")}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {data.gallery
                      .filter((w) => w.payerName === activeBrand.name)
                      .map((w) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={w.id}
                          src={w.imageUrl}
                          alt={w.title}
                          loading="lazy"
                          className="aspect-square w-full rounded-xl object-cover"
                        />
                      ))}
                    {/* Inline add-work tile — uploads directly to this brand */}
                    <button
                      type="button"
                      onClick={() => brandWorkInputRef.current?.click()}
                      disabled={
                        uploadingBrandWork ||
                        !jobs.some((j) => j.payerName === activeBrand.name)
                      }
                      aria-label={t("addWork")}
                      className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingBrandWork ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <ImagePlus className="size-5" />
                      )}
                      <span className="text-[11px] font-medium">{t("addWork")}</span>
                    </button>
                  </div>
                  <input
                    ref={brandWorkInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      uploadBrandWork(activeBrand.name, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addWorkTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{t("addWorkHint")}</p>
            <div className="space-y-1.5">
              <Label>{t("addWorkJob")}</Label>
              <Select value={addJobId} onValueChange={setAddJobId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("addWorkJobPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.payerName ? `${j.payerName} — ${j.title}` : j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FileUpload value={addFiles} onChange={setAddFiles} accept="image/*" multiple />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={uploadWork}
                disabled={uploading || !addJobId || addFiles.length === 0}
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                {t("addWorkSubmit")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------- RATE CARD (editable) ---------- */}
      <section className="space-y-4">
        <SectionHeading icon={BadgeCheck} title={tRate("mediaKitRateCard")} />

        <Card className="overflow-hidden rounded-2xl">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-[12rem_1fr] sm:items-center">
            <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
              {profile.rateCardBgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.rateCardBgUrl}
                  alt={t("rateCardBg")}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-violet-500/10 text-muted-foreground">
                  <ImageIcon className="size-6" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">{t("rateCardBg")}</h3>
                <p className="text-xs text-muted-foreground">{t("rateCardBgHint")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => rateCardBgInputRef.current?.click()}
                  disabled={uploadingRateCardBg}
                >
                  {uploadingRateCardBg ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImageIcon className="size-4" />
                  )}
                  {profile.rateCardBgUrl ? t("changePhoto") : t("uploadPhoto")}
                </Button>
                {profile.rateCardBgUrl && !uploadingRateCardBg && (
                  <Button type="button" variant="ghost" size="sm" onClick={removeRateCardBg}>
                    <Trash2 className="size-4 text-destructive" />
                    {t("removePhoto")}
                  </Button>
                )}
              </div>
              <input
                ref={rateCardBgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  uploadRateCardBg(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Suggestions from past deals */}
        {suggestions.length > 0 && (
          <Card className="rounded-2xl">
            <CardContent className="space-y-3 p-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-primary" />
                  {tRate("suggestionsTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">{tRate("suggestionsHint")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      addRateRow({
                        platform: s.platform,
                        contentType: s.contentType,
                        price: s.avg,
                        currency: s.currency,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs transition-colors hover:bg-primary/5 active:scale-[0.98]"
                  >
                    <Plus className="size-3 text-primary" />
                    <span className="font-medium">
                      {[s.platform, s.contentType].filter(Boolean).join(" · ")}
                    </span>
                    <span className="text-primary">
                      {s.avg.toLocaleString("en-US")} {s.currency}
                    </span>
                    <span className="text-muted-foreground">
                      {tRate("dealCount", { count: s.count })}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rate editor */}
        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{tRate("rateCardTitle")}</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => addRateRow()}>
                <Plus className="size-4" />
                {tRate("addRow")}
              </Button>
            </div>
            {rateRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {tRate("emptyRows")}
              </p>
            ) : (
              rateRows.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[1.3fr_1fr_0.9fr_1.3fr_auto]"
                >
                  <Input
                    value={row.contentType}
                    placeholder={tRate("colDeliverable")}
                    onChange={(e) => updateRateRow(i, { contentType: e.target.value })}
                  />
                  <Input
                    value={row.platform}
                    placeholder={tRate("colPlatform")}
                    onChange={(e) => updateRateRow(i, { platform: e.target.value })}
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={row.price ? String(row.price) : ""}
                    placeholder={tRate("colPrice")}
                    onChange={(e) => updateRateRow(i, { price: Number(e.target.value) || 0 })}
                  />
                  <Input
                    value={row.notes ?? ""}
                    placeholder={tRate("colNotes")}
                    onChange={(e) => updateRateRow(i, { notes: e.target.value || null })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRateRow(i)}
                    aria-label={tRate("removeRow")}
                    className="justify-self-end"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
            <div className="flex justify-end">
              <Button type="button" onClick={saveRates} disabled={savingRates}>
                {savingRates ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {tRate("save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---------- CONTACT ---------- */}
      <section>
        <Card className="relative rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5">
          {!editingContact && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={startEditContact}
              aria-label={t("editContact")}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-4" />
            </Button>
          )}
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            {editingContact ? (
              <div className="w-full max-w-md space-y-3 text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="ct-title">{t("contactTitleLabel")}</Label>
                  <Input
                    id="ct-title"
                    value={profile.contactTitle}
                    placeholder={t("contactTitle")}
                    onChange={(e) => updateProfile({ contactTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ct-hint">{t("contactHintLabel")}</Label>
                  <Input
                    id="ct-hint"
                    value={profile.contactHint}
                    placeholder={t("contactHint")}
                    onChange={(e) => updateProfile({ contactHint: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ct-line-id">{t("lineContactLabel")}</Label>
                  <Input
                    id="ct-line-id"
                    value={profile.lineContact}
                    placeholder={t("lineContactPlaceholder")}
                    onChange={(e) => updateProfile({ lineContact: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ct-line-url">{t("lineUrlLabel")}</Label>
                  <Input
                    id="ct-line-url"
                    type="url"
                    value={profile.lineUrl}
                    placeholder={t("lineUrlPlaceholder")}
                    onChange={(e) => updateProfile({ lineUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">{t("lineUrlHint")}</p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditContact}
                    disabled={savingContact}
                  >
                    <X className="size-4" />
                    {t("cancel")}
                  </Button>
                  <Button type="button" size="sm" onClick={saveContact} disabled={savingContact}>
                    {savingContact ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {t("saveProfile")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold">
                  {profile.contactTitle?.trim() || t("contactTitle")}
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  {profile.contactHint?.trim() || t("contactHint")}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(profile.lineContact.trim() || handleAt) && (
                    <a
                      href={profile.lineUrl.trim() || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/5"
                    >
                      {profile.lineContact.trim() ? `LINE ${profile.lineContact.trim()}` : handleAt}
                    </a>
                  )}
                  <Button
                    type="button"
                    onClick={downloadMediaKit}
                    disabled={downloading}
                    className="bg-gradient-to-r from-primary to-violet-500"
                  >
                    {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    {tRate("downloadMediaKit")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ---------- SOCIAL MEDIA ---------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <SectionHeading icon={ExternalLink} title={t("socialTitle")} />
          <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
            <Plus className="size-4" />
            {t("addSocialLink")}
          </Button>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-4">
            {profile.socialLinks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("socialEmpty")}
              </p>
            ) : (
              profile.socialLinks.map((link, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[0.7fr_0.8fr_1.6fr_auto]"
                >
                  <Input
                    value={link.imageUrl ?? ""}
                    placeholder={t("socialImagePlaceholder")}
                    onChange={(e) => updateSocialLink(i, { imageUrl: e.target.value })}
                  />
                  <Input
                    value={link.label}
                    placeholder={t("socialLabelPlaceholder")}
                    onChange={(e) => updateSocialLink(i, { label: e.target.value })}
                  />
                  <Input
                    type="url"
                    value={link.url}
                    placeholder={t("socialUrlPlaceholder")}
                    onChange={(e) => updateSocialLink(i, { url: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSocialLink(i)}
                    aria-label={t("removeSocialLink")}
                    className="justify-self-end"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
            <div className="flex justify-end">
              <Button type="button" onClick={saveSocialLinks} disabled={savingSocial}>
                {savingSocial ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {t("saveProfile")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---------- BILLING / INVOICE DETAILS ---------- */}
      {editing && (
        <section className="space-y-4">
          <SectionHeading icon={Receipt} title={tBilling("title")} />
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">{tBilling("subtitle")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bl-name">{tBilling("legalName")}</Label>
                  <Input
                    id="bl-name"
                    value={profile.legalName}
                    onChange={(e) => updateProfile({ legalName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bl-tax">{tBilling("taxId")}</Label>
                  <Input
                    id="bl-tax"
                    value={profile.taxId}
                    onChange={(e) => updateProfile({ taxId: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bl-phone">{tBilling("phone")}</Label>
                  <Input
                    id="bl-phone"
                    value={profile.phone}
                    onChange={(e) => updateProfile({ phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bl-address">{tBilling("address")}</Label>
                  <Input
                    id="bl-address"
                    value={profile.address}
                    onChange={(e) => updateProfile({ address: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bl-bank">{tBilling("bankDetails")}</Label>
                <Textarea
                  id="bl-bank"
                  rows={3}
                  value={profile.bankDetails}
                  placeholder={tBilling("bankPlaceholder")}
                  onChange={(e) => updateProfile({ bankDetails: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={saveBilling} disabled={savingBilling}>
                  {savingBilling ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {t("saveProfile")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {confirmDialog}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold">
      <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
        <Icon className="size-4" />
      </span>
      {title}
    </h2>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:bg-primary/5",
      )}
    >
      {children}
    </button>
  );
}
