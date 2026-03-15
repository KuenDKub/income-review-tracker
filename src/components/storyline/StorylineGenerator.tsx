"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Film } from "lucide-react";
import type { StorylineSceneRow, StorylineSections } from "@/lib/ai/storylineParser";
import { buildStorylinePlainText } from "@/lib/storylineExport";
import { toast } from "@/lib/toast";

const TIKTOK_FIXED = "francfoil";

/** Document order: Storyline title first, then table, then CTA, Caption. Extra sections in details. */
const MAIN_SECTION_ORDER: (keyof StorylineSections)[] = [
  "TITLE",
  "CTA",
  "CAPTION_IDEA",
];
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

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export type StorylineFormData = {
  sections: StorylineSections;
  scenesTable: StorylineSceneRow[];
};

type StorylineGeneratorProps = {
  initialData?: StorylineFormData | null;
  onDataChange?: (data: StorylineFormData) => void;
};

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
      const titleForFile = (sections.TITLE ?? "").trim().replace(/[/\\:*?"<>|]/g, "").slice(0, 100);
      a.download = titleForFile ? `storyline - ${titleForFile}.docx` : "storyline.docx";
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
    <div className="flex min-h-0 flex-1 flex-col">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <Film className="size-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          {/* Document-style body: TikTok → Storyline → Table → CTA → Caption */}
          <article className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
            {/* 1. TikTok (fixed) */}
            <section className="border-b px-4 py-3 sm:px-6 sm:py-4">
              <p className="text-sm font-medium text-muted-foreground">
                TikTok : {TIKTOK_FIXED}
              </p>
            </section>

            {/* 2. Storyline title */}
            <section className="border-b px-4 py-3 sm:px-6 sm:py-4">
              <Label htmlFor="storyline-TITLE" className="text-sm font-medium">
                {t("storylineLabel")}
              </Label>
              <Input
                id="storyline-TITLE"
                value={sections.TITLE}
                onChange={(e) => updateSection("TITLE", e.target.value)}
                placeholder={t("sectionTitle")}
                className={`mt-1.5 ${inputClass}`}
              />
            </section>

            {/* 3. Scenes table (Scene | Text | Soundtrack) */}
            <section className="border-b px-4 py-3 sm:px-6 sm:py-4">
              <ScenesTable
                scenesTable={scenesTable}
                onScenesTableChange={updateScenesTable}
                t={t}
              />
            </section>

            {/* 4. Caption Idea */}
            <section className="px-4 py-3 sm:px-6 sm:py-4">
              <Label
                htmlFor="storyline-CAPTION_IDEA"
                className="text-sm font-medium"
              >
                {t("sectionCaptionIdea")}
              </Label>
              <textarea
                id="storyline-CAPTION_IDEA"
                value={sections.CAPTION_IDEA}
                onChange={(e) =>
                  updateSection("CAPTION_IDEA", e.target.value)
                }
                placeholder={t("sectionCaptionIdea")}
                rows={2}
                className={`mt-1.5 ${inputClass}`}
              />
            </section>

            {/* Extra sections (Subtitle, Genre, Hook, Vibe) in collapsible */}
            <details className="border-t px-4 py-3 sm:px-6">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                {t("extraSections")}
              </summary>
              <div className="mt-4 space-y-4">
                {EXTRA_SECTION_ORDER.map((key) => {
                  const isShort = key === "DRESS_CODE";
                  return (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={`storyline-extra-${key}`}>
                        {t(sectionLabelKey(key))}
                      </Label>
                      {isShort ? (
                        <Input
                          id={`storyline-extra-${key}`}
                          value={sections[key]}
                          onChange={(e) => updateSection(key, e.target.value)}
                          placeholder={t(sectionLabelKey(key))}
                          className={inputClass}
                        />
                      ) : (
                        <textarea
                          id={`storyline-extra-${key}`}
                          value={sections[key]}
                          onChange={(e) =>
                            updateSection(key, e.target.value)
                          }
                          placeholder={t(sectionLabelKey(key))}
                          rows={2}
                          className={inputClass}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          </article>

          {error && (
            <p className="shrink-0 mx-4 mb-4 text-sm text-destructive sm:mx-6" role="alert">
              {error}
            </p>
          )}

          <div className="flex shrink-0 flex-wrap gap-2 border-t bg-muted/10 px-4 py-4 sm:px-6">
            <Button
              onClick={handleDownloadDocx}
              className="min-h-[44px] touch-manipulation"
            >
              {t("downloadDocx")}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyText}
              className="min-h-[44px] touch-manipulation"
            >
              {t("copyAsText")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type ScenesTableProps = {
  scenesTable: StorylineSceneRow[];
  onScenesTableChange: (next: StorylineSceneRow[]) => void;
  t: (key: string) => string;
};

function ScenesTable({
  scenesTable,
  onScenesTableChange,
  t,
}: ScenesTableProps) {
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
        scenesTable.filter((r) => r.index !== index).map((r, i) => ({ ...r, index: i + 1 }))
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

  const inputClass =
    "w-full min-w-0 rounded border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t("scenesTableTitle")}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          {t("addScene")}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border border-slate-300/80 dark:border-slate-700/80 bg-white dark:bg-[#111111]">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-slate-100 dark:bg-slate-800/60">
            <tr>
              <th className="text-left font-semibold p-2 w-2/5 text-slate-700 dark:text-slate-200">
                {t("tableHeaderScene")}
              </th>
              <th className="text-left font-semibold p-2 w-1/5 text-slate-700 dark:text-slate-200">
                {t("tableHeaderText")}
              </th>
              <th className="text-left font-semibold p-2 w-2/5 text-slate-700 dark:text-slate-200">
                {t("tableHeaderSoundtrack")}
              </th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {scenesTable.length === 0 ? (
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td
                  className="p-3 text-muted-foreground text-center"
                  colSpan={4}
                >
                  {t("tableEmpty")}
                </td>
              </tr>
            ) : (
              [...scenesTable]
                .sort((a, b) => a.index - b.index)
                .map((row) => (
                  <tr
                    key={row.index}
                    className="border-t border-slate-200 dark:border-slate-800 align-top"
                  >
                    <td className="p-2">
                      <div className="flex items-start gap-1">
                        <span className="shrink-0 text-muted-foreground">
                          (Scene {row.index}) :
                        </span>
                        <textarea
                          value={row.action}
                          onChange={(e) =>
                            updateRow(row.index, "action", e.target.value)
                          }
                          placeholder={t("tableHeaderScene")}
                          rows={2}
                          className={`min-w-0 flex-1 ${inputClass}`}
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <textarea
                        value={row.text}
                        onChange={(e) =>
                          updateRow(row.index, "text", e.target.value)
                        }
                        placeholder={t("tableHeaderText")}
                        rows={2}
                        className={inputClass}
                      />
                    </td>
                    <td className="p-2">
                      <textarea
                        value={row.soundtrack}
                        onChange={(e) =>
                          updateRow(row.index, "soundtrack", e.target.value)
                        }
                        placeholder={t("tableHeaderSoundtrack")}
                        rows={2}
                        className={inputClass}
                      />
                    </td>
                    <td className="p-2 align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(row.index)}
                        className="text-destructive hover:text-destructive"
                      >
                        {t("removeScene")}
                      </Button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
