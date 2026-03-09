"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Film } from "lucide-react";
import { parseStoryline } from "@/lib/ai/storylineParser";
import type {
  StorylineParseResult,
  StorylineSceneRow,
  StorylineSections,
} from "@/lib/ai/storylineParser";

const SECTION_LABEL_KEYS: Record<keyof StorylineSections, string> = {
  TITLE: "sectionTitle",
  SUBTITLE: "sectionSubtitle",
  GENRE: "sectionGenre",
  HOOK: "sectionHook",
  VIBE: "sectionVibe",
  CTA: "sectionCta",
  CAPTION_IDEA: "sectionCaptionIdea",
};

type StorylineResult = {
  success: true;
  sections: StorylineSections;
  scenesTable: StorylineSceneRow[];
};

export default function StorylineGenerator() {
  const t = useTranslations("storyline");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StorylineResult | null>(null);
  const [liveParsed, setLiveParsed] = useState<StorylineParseResult | null>(
    null
  );
  const [error, setError] = useState("");

  const showSections = liveParsed?.sections ?? result?.sections ?? null;
  const showScenes = liveParsed?.scenesTable ?? result?.scenesTable ?? [];
  const isStreaming = loading && liveParsed !== null;

  const title = showSections?.TITLE ?? "";
  const subtitle = showSections?.SUBTITLE ?? "";
  const cta = showSections?.CTA ?? "";
  const captionIdea = showSections?.CAPTION_IDEA ?? "";
  const hook = showSections?.HOOK ?? "";
  const vibe = showSections?.VIBE ?? "";

  const formatSceneCell = (row: StorylineSceneRow) => {
    const cleaned = (row.action ?? "")
      .trim()
      .replace(/^\(?\s*scene\s*\d+\s*\)?\s*[:：-]?\s*/i, "")
      .trim();
    return cleaned ? `(Scene ${row.index}) : ${cleaned}` : `(Scene ${row.index})`;
  };

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setLiveParsed(null);

    try {
      const res = await fetch("/api/storyline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewPrompt: prompt, stream: true }),
      });

      const contentType = res.headers.get("Content-Type") ?? "";

      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ") && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6)) as
                  | { delta?: string }
                  | { sections?: StorylineSections; scenesTable?: StorylineSceneRow[] }
                  | Record<string, never>
                  | { error?: string };
                if (currentEvent === "delta" && "delta" in data && data.delta) {
                  accumulated += data.delta;
                  setLiveParsed(parseStoryline(accumulated));
                } else if (currentEvent === "reset") {
                  accumulated = "";
                  setLiveParsed(null);
                } else if (currentEvent === "done" && "sections" in data) {
                  setResult({
                    success: true,
                    sections: data.sections ?? ({} as StorylineSections),
                    scenesTable: (data as { scenesTable?: StorylineSceneRow[] }).scenesTable ?? [],
                  });
                  setLiveParsed(null);
                } else if (currentEvent === "error" && "error" in data) {
                  setError(data.error ?? "Unknown error");
                }
              } catch {
                // skip malformed line
              }
              currentEvent = "";
            }
          }
        }
      } else {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed");
        setResult(data as StorylineResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const handleDownload = useCallback(async () => {
    if (!result) return;
    try {
      const res = await fetch("/api/storyline/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: result.sections,
          scenesTable: result.scenesTable,
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
      a.download = "storyline.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [result]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="size-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storyline-prompt">{t("promptLabel")}</Label>
            <textarea
              id="storyline-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("promptPlaceholder")}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button onClick={generate} disabled={loading || !prompt.trim()}>
            {loading ? t("generating") : t("generateButton")}
          </Button>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {showSections && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("livePreview")}
              </p>
              {/* Document-style preview: paper look, readable typography */}
              <article className="rounded-lg border bg-[#fafafa] dark:bg-[#1a1a1a] shadow-sm max-w-[21cm] mx-auto overflow-hidden">
                <div className="px-8 py-10 sm:px-12 sm:py-14 min-h-160">
                  <header className="text-center">
                    {title && (
                      <h2 className="text-2xl sm:text-[28px] font-bold text-foreground leading-tight">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-lg sm:text-xl font-semibold text-foreground mt-1">
                        {subtitle}
                      </p>
                    )}
                    <div className="mx-auto mt-4 h-px w-40 bg-slate-600/70 dark:bg-slate-400/60" />
                  </header>

                  {/* Scenes table */}
                  <section className="mt-8">
                    <div className="overflow-x-auto rounded-md border border-slate-300/80 dark:border-slate-700/80 bg-white dark:bg-[#111111]">
                      <table className="w-full text-sm table-fixed">
                        <thead className="bg-slate-100 dark:bg-slate-800/60">
                          <tr>
                            <th className="text-left font-semibold p-3 w-2/5 text-slate-700 dark:text-slate-200">
                              {t("tableHeaderScene")}
                            </th>
                            <th className="text-left font-semibold p-3 w-1/5 text-slate-700 dark:text-slate-200">
                              {t("tableHeaderText")}
                            </th>
                            <th className="text-left font-semibold p-3 w-2/5 text-slate-700 dark:text-slate-200">
                              {t("tableHeaderSoundtrack")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showScenes ?? []).map((row) => (
                            <tr key={row.index} className="border-t border-slate-200 dark:border-slate-800 align-top">
                              <td className="p-3 whitespace-pre-line text-[13px] leading-relaxed">
                                {formatSceneCell(row)}
                              </td>
                              <td className="p-3 whitespace-pre-line text-[13px] leading-relaxed">
                                {row.text}
                              </td>
                              <td className="p-3 whitespace-pre-line text-[13px] leading-relaxed">
                                {row.soundtrack}
                              </td>
                            </tr>
                          ))}
                          {(!showScenes || showScenes.length === 0) && (
                            <tr className="border-t border-slate-200 dark:border-slate-800">
                              <td className="p-3 text-muted-foreground" colSpan={3}>
                                {t("tableEmpty")}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {(cta || captionIdea) && (
                    <section className="mt-8 space-y-4">
                      {cta && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            {t(SECTION_LABEL_KEYS.CTA)}
                          </h3>
                          <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-line">
                            {cta}
                          </p>
                        </div>
                      )}
                      {captionIdea && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            {t(SECTION_LABEL_KEYS.CAPTION_IDEA)}
                          </h3>
                          <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-line">
                            {captionIdea}
                          </p>
                        </div>
                      )}
                    </section>
                  )}

                  {(hook || vibe) && (
                    <section className="mt-8">
                      <details className="rounded-md border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-white/5 px-4 py-3">
                        <summary className="cursor-pointer text-sm font-medium text-foreground">
                          {t("sectionHook")} / {t("sectionVibe")}
                        </summary>
                        <div className="mt-3 space-y-4">
                          {hook && (
                            <div>
                              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                {t(SECTION_LABEL_KEYS.HOOK)}
                              </h3>
                              <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-line">
                                {hook}
                              </p>
                            </div>
                          )}
                          {vibe && (
                            <div>
                              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                {t(SECTION_LABEL_KEYS.VIBE)}
                              </h3>
                              <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-line">
                                {vibe}
                              </p>
                            </div>
                          )}
                        </div>
                      </details>
                    </section>
                  )}

                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-baseline" />
                  )}
                </div>
              </article>

              {result && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4 py-2 hover:bg-primary/90"
                >
                  {t("downloadDocx")}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
