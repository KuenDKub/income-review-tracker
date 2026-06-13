"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AtSign,
  Clapperboard,
  Copy,
  Download,
  Hash,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type {
  StorylineSceneRow,
  StorylineSections,
} from "@/lib/ai/storylineParser";
import { buildStorylinePlainText } from "@/lib/storylineExport";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const TIKTOK_FIXED = "francfoil";

const EXTRA_SECTION_ORDER: (keyof StorylineSections)[] = [
  "VIBE",
  "CTA",
  "DRESS_CODE",
];

const EMPTY_SECTIONS: StorylineSections = {
  TITLE: "",
  SUBTITLE: "",
  GENRE: "",
  HOOK: "",
  VIBE: "",
  CTA: "",
  CAPTION_IDEA: "",
  DRESS_CODE: "",
};

export type StorylineFormData = {
  sections: StorylineSections;
  scenesTable: StorylineSceneRow[];
};

type StorylineGeneratorProps = {
  initialData?: StorylineFormData | null;
  onDataChange?: (data: StorylineFormData) => void;
};

function SectionHeading({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        {label}
      </span>
      {children}
    </div>
  );
}

export default function StorylineGenerator({
  initialData,
  onDataChange,
}: StorylineGeneratorProps) {
  const t = useTranslations("storyline");
  const [sections, setSections] = useState<StorylineSections>(
    () => initialData?.sections ?? { ...EMPTY_SECTIONS }
  );
  const [scenesTable, setScenesTable] = useState<StorylineSceneRow[]>(
    () => initialData?.scenesTable ?? []
  );
  const [error, setError] = useState("");

  const updateSection = useCallback(
    (key: keyof StorylineSections, value: string) => {
      const next = { ...sections, [key]: value };
      setSections(next);
      onDataChange?.({ sections: next, scenesTable });
    },
    [sections, scenesTable, onDataChange]
  );

  const updateScenesTable = useCallback(
    (next: StorylineSceneRow[]) => {
      setScenesTable(next);
      onDataChange?.({ sections, scenesTable: next });
    },
    [sections, onDataChange]
  );

  const handleDownloadDocx = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/storyline/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections,
          scenesTable,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const titleForFile = (sections.TITLE ?? "")
        .trim()
        .replace(/[/\\:*?"<>|]/g, "")
        .slice(0, 100);
      a.download = titleForFile
        ? `storyline - ${titleForFile}.docx`
        : "storyline.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  }, [sections, scenesTable]);

  const handleCopyText = useCallback(async () => {
    const text = buildStorylinePlainText(sections, scenesTable);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copySuccess"));
    } catch {
      toast.error(t("copyError"));
    }
  }, [sections, scenesTable, t]);

  const sectionLabelKey = (key: keyof StorylineSections) =>
    key === "TITLE"
      ? "sectionTitle"
      : key === "SUBTITLE"
        ? "sectionSubtitle"
        : key === "GENRE"
          ? "sectionGenre"
          : key === "HOOK"
            ? "sectionHook"
            : key === "VIBE"
              ? "sectionVibe"
              : key === "CTA"
                ? "sectionCta"
                : key === "DRESS_CODE"
                  ? "sectionDressCode"
                  : "sectionCaptionIdea";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
        {/* Title block */}
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <AtSign className="size-3.5" />
              TikTok · {TIKTOK_FIXED}
            </p>
            <div>
              <Label
                htmlFor="storyline-TITLE"
                className="text-xs text-muted-foreground"
              >
                {t("storylineLabel")}
              </Label>
              <AutoResizeTextarea
                id="storyline-TITLE"
                value={sections.TITLE}
                onChange={(e) => updateSection("TITLE", e.target.value)}
                placeholder={t("sectionTitle")}
                className="mt-1 w-full resize-none border-none bg-transparent p-0 text-xl font-bold leading-snug outline-none placeholder:text-muted-foreground/40 focus-visible:ring-0 sm:text-2xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Scenes */}
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <SectionHeading icon={Clapperboard} label={t("scenesTableTitle")} />
            <SceneCards
              scenesTable={scenesTable}
              onScenesTableChange={updateScenesTable}
              t={t}
            />
          </CardContent>
        </Card>

        {/* Caption */}
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <SectionHeading icon={Hash} label={t("sectionCaptionIdea")} />
            <AutoResizeTextarea
              id="storyline-CAPTION_IDEA"
              value={sections.CAPTION_IDEA}
              onChange={(e) => updateSection("CAPTION_IDEA", e.target.value)}
              placeholder={t("sectionCaptionIdea")}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Extras */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 touch-manipulation [&::-webkit-details-marker]:hidden">
                <SectionHeading icon={Sparkles} label={t("extraSections")} />
                <Plus
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <div className="mt-4 space-y-4">
                {EXTRA_SECTION_ORDER.map((key) => {
                  const isShort = key === "DRESS_CODE";
                  const fieldClass =
                    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
                  return (
                    <div key={key} className="space-y-1.5">
                      <Label
                        htmlFor={`storyline-extra-${key}`}
                        className="text-xs text-muted-foreground"
                      >
                        {t(sectionLabelKey(key))}
                      </Label>
                      {isShort ? (
                        <Input
                          id={`storyline-extra-${key}`}
                          value={sections[key]}
                          onChange={(e) => updateSection(key, e.target.value)}
                          placeholder={t(sectionLabelKey(key))}
                        />
                      ) : (
                        <AutoResizeTextarea
                          id={`storyline-extra-${key}`}
                          value={sections[key]}
                          onChange={(e) => updateSection(key, e.target.value)}
                          placeholder={t(sectionLabelKey(key))}
                          className={fieldClass}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Action bar */}
      <div className="flex shrink-0 flex-wrap gap-2 rounded-xl border bg-card p-3">
        <Button
          onClick={handleDownloadDocx}
          className="min-h-[44px] flex-1 touch-manipulation sm:flex-none"
        >
          <Download className="size-4" />
          {t("downloadDocx")}
        </Button>
        <Button
          variant="outline"
          onClick={handleCopyText}
          className="min-h-[44px] flex-1 touch-manipulation sm:flex-none"
        >
          <Copy className="size-4" />
          {t("copyAsText")}
        </Button>
      </div>
    </div>
  );
}

type SceneCardsProps = {
  scenesTable: StorylineSceneRow[];
  onScenesTableChange: (next: StorylineSceneRow[]) => void;
  t: (key: string) => string;
};

function SceneCards({ scenesTable, onScenesTableChange, t }: SceneCardsProps) {
  const addRow = useCallback(() => {
    const nextIndex =
      scenesTable.length > 0
        ? Math.max(...scenesTable.map((r) => r.index)) + 1
        : 1;
    onScenesTableChange([
      ...scenesTable,
      { index: nextIndex, action: "", text: "", soundtrack: "" },
    ]);
  }, [scenesTable, onScenesTableChange]);

  const removeRow = useCallback(
    (index: number) => {
      onScenesTableChange(
        scenesTable
          .filter((r) => r.index !== index)
          .map((r, i) => ({ ...r, index: i + 1 }))
      );
    },
    [scenesTable, onScenesTableChange]
  );

  const updateRow = useCallback(
    (index: number, field: keyof StorylineSceneRow, value: string | number) => {
      onScenesTableChange(
        scenesTable.map((r) =>
          r.index === index ? { ...r, [field]: value } : r
        )
      );
    },
    [scenesTable, onScenesTableChange]
  );

  const fieldClass =
    "w-full min-w-0 rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-3">
      {scenesTable.length === 0 ? (
        <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          {t("tableEmpty")}
        </p>
      ) : (
        [...scenesTable]
          .sort((a, b) => a.index - b.index)
          .map((row) => (
            <div
              key={row.index}
              className="rounded-xl border bg-muted/30 p-3 sm:p-4"
            >
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <Clapperboard className="size-3" />
                  Scene {row.index}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeRow(row.index)}
                  aria-label={t("removeScene")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("tableHeaderScene")}
                  </Label>
                  <AutoResizeTextarea
                    value={row.action}
                    onChange={(e) =>
                      updateRow(row.index, "action", e.target.value)
                    }
                    placeholder={t("tableHeaderScene")}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("tableHeaderText")}
                  </Label>
                  <AutoResizeTextarea
                    value={row.text}
                    onChange={(e) =>
                      updateRow(row.index, "text", e.target.value)
                    }
                    placeholder={t("tableHeaderText")}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("tableHeaderSoundtrack")}
                  </Label>
                  <AutoResizeTextarea
                    value={row.soundtrack}
                    onChange={(e) =>
                      updateRow(row.index, "soundtrack", e.target.value)
                    }
                    placeholder={t("tableHeaderSoundtrack")}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
          ))
      )}

      <button
        type="button"
        onClick={addRow}
        className={cn(
          "flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors touch-manipulation",
          "hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-[0.99]"
        )}
      >
        <Plus className="size-4" />
        {t("addScene")}
      </button>
    </div>
  );
}
