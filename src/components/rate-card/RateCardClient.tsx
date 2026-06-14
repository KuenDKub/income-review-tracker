"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Building2,
  Download,
  FileText,
  Globe,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatTile } from "@/components/ui/stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { toast } from "@/lib/toast";

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

type Stats = {
  totalDeals: number;
  brandCount: number;
  platforms: string[];
  firstDealYear: number | null;
};

type LoadResponse = {
  data: { rateCards: RateRow[]; suggestions: Suggestion[]; stats: Stats };
};

export function RateCardClient() {
  const t = useTranslations("rateCard");

  // Profile is the DB-backed single source of truth (shared with the portfolio).
  const { profile, update: updateProfile, save: saveProfile } = useCreatorProfile();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RateRow[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/rate-cards")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: LoadResponse) => {
        setRows(json.data.rateCards);
        setSuggestions(json.data.suggestions);
        setStats(json.data.stats);
      })
      .catch(() => toast.error(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  function addRow(seed?: Partial<RateRow>) {
    setRows((prev) => [
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

  function updateRow(index: number, patch: Partial<RateRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/rate-cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) throw new Error("save failed");
      const json: { data: { rateCards: RateRow[] } } = await res.json();
      setRows(json.data.rateCards);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function downloadMediaKit() {
    setDownloading(true);
    try {
      const res = await fetch("/api/rate-cards/media-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName: profile.creatorName || profile.handle || "Creator",
          handle: profile.handle ? `@${profile.handle.replace(/^@/, "")}` : "",
          tagline: profile.tagline,
          filename: "media-kit.docx",
          labels: {
            rateCard: t("mediaKitRateCard"),
            deliverable: t("colDeliverable"),
            platform: t("colPlatform"),
            price: t("colPrice"),
            notes: t("colNotes"),
            dealsDone: t("statDeals"),
            brands: t("statBrands"),
            onPlatforms: t("statPlatforms"),
            since: t("since"),
            generatedNote: t("generatedNote"),
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
      toast.success(t("mediaKitDownloaded"));
    } catch {
      toast.error(t("mediaKitError"));
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            icon={Briefcase}
            tone="primary"
            label={t("statDeals")}
            value={String(stats.totalDeals)}
            className="rounded-2xl"
          />
          <StatTile
            icon={Building2}
            tone="primary"
            label={t("statBrands")}
            value={String(stats.brandCount)}
            className="rounded-2xl"
          />
          <StatTile
            icon={Globe}
            tone="primary"
            label={t("statPlatforms")}
            value={String(stats.platforms.length)}
            sublabel={stats.platforms.slice(0, 4).join(", ") || undefined}
            className="rounded-2xl"
          />
        </div>
      )}

      {/* Suggestions from past deals */}
      {suggestions.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" />
              {t("suggestionsTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("suggestionsHint")}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  addRow({
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
                  {t("dealCount", { count: s.count })}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rate editor */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{t("rateCardTitle")}</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => addRow()}>
              <Plus className="size-4" />
              {t("addRow")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("emptyRows")}
            </p>
          ) : (
            rows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[1.3fr_1fr_0.9fr_1.3fr_auto]"
              >
                <Input
                  value={row.contentType}
                  placeholder={t("colDeliverable")}
                  onChange={(e) => updateRow(i, { contentType: e.target.value })}
                />
                <Input
                  value={row.platform}
                  placeholder={t("colPlatform")}
                  onChange={(e) => updateRow(i, { platform: e.target.value })}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  value={row.price ? String(row.price) : ""}
                  placeholder={t("colPrice")}
                  onChange={(e) => updateRow(i, { price: Number(e.target.value) || 0 })}
                />
                <Input
                  value={row.notes ?? ""}
                  placeholder={t("colNotes")}
                  onChange={(e) => updateRow(i, { notes: e.target.value || null })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(i)}
                  aria-label={t("removeRow")}
                  className="justify-self-end"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
          <div className="flex justify-end">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media kit export */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4 text-primary" />
            {t("mediaKitTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("mediaKitHint")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="mk-name">{t("creatorName")}</Label>
              <Input
                id="mk-name"
                value={profile.creatorName}
                placeholder={t("creatorNamePlaceholder")}
                onChange={(e) => updateProfile({ creatorName: e.target.value })}
                onBlur={() => saveProfile(profile)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mk-handle">{t("handle")}</Label>
              <Input
                id="mk-handle"
                value={profile.handle}
                placeholder="francfoil"
                onChange={(e) => updateProfile({ handle: e.target.value })}
                onBlur={() => saveProfile(profile)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mk-tagline">{t("tagline")}</Label>
              <Input
                id="mk-tagline"
                value={profile.tagline}
                placeholder={t("taglinePlaceholder")}
                onChange={(e) => updateProfile({ tagline: e.target.value })}
                onBlur={() => saveProfile(profile)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={downloadMediaKit}
              disabled={downloading}
              className="bg-gradient-to-r from-primary to-violet-500"
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {t("downloadMediaKit")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
