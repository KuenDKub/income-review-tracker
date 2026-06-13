import { z } from "zod";
import { newSceneId } from "@/lib/ai/storylineParser";
import type { StorylineFormData } from "@/components/storyline/StorylineGenerator";

const STORAGE_KEY = "storyline_forms_cache";
const CACHE_VERSION = 2;

export type StorylineFormItem = {
  id: string;
  title: string;
  formData: StorylineFormData;
};

const sectionsSchema = z.object({
  TITLE: z.string(),
  SUBTITLE: z.string(),
  GENRE: z.string(),
  HOOK: z.string(),
  VIBE: z.string(),
  CTA: z.string(),
  CAPTION_IDEA: z.string(),
  DRESS_CODE: z.string(),
});

// `id` is optional here so we can migrate v1 rows that predate stable ids.
const sceneRowSchema = z.object({
  id: z.string().optional(),
  index: z.number(),
  action: z.string(),
  text: z.string(),
  soundtrack: z.string(),
});

const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  formData: z.object({
    sections: sectionsSchema,
    scenesTable: z.array(sceneRowSchema),
  }),
});

const cacheSchema = z.object({
  version: z.number(),
  items: z.array(itemSchema),
});

/** Ensure every scene row has a stable id (backfills v1 data without one). */
function withSceneIds(items: z.infer<typeof cacheSchema>["items"]): StorylineFormItem[] {
  return items.map((item) => ({
    ...item,
    formData: {
      ...item.formData,
      scenesTable: item.formData.scenesTable.map((row) => ({
        ...row,
        id: row.id ?? newSceneId(),
      })),
    },
  }));
}

export function readStorylineCache(): StorylineFormItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = cacheSchema.safeParse(JSON.parse(raw));
    // Note: no TTL — these forms are user documents, not a refetchable cache.
    // Invalid/corrupt payloads degrade to empty rather than crashing.
    if (!parsed.success) return [];
    return withSceneIds(parsed.data.items);
  } catch {
    return [];
  }
}

export function writeStorylineCache(items: StorylineFormItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: CACHE_VERSION, items })
    );
  } catch {
    // ignore (quota / private mode)
  }
}

export function getItemTitle(formData: StorylineFormData, fallback: string): string {
  const title = (formData.sections?.TITLE ?? "").trim();
  const subtitle = (formData.sections?.SUBTITLE ?? "").trim();
  return title || subtitle || fallback;
}
