import type { StorylineFormData } from "@/components/storyline/StorylineGenerator";

const STORAGE_KEY = "storyline_forms_cache";
const TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export type StorylineFormItem = {
  id: string;
  title: string;
  formData: StorylineFormData;
};

export type StorylineCacheValue = {
  expiresAt: number;
  items: StorylineFormItem[];
};

export function readStorylineCache(): StorylineFormItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as StorylineCacheValue;
    if (Date.now() > data.expiresAt) return [];
    return data.items ?? [];
  } catch {
    return [];
  }
}

export function writeStorylineCache(items: StorylineFormItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const value: StorylineCacheValue = {
      expiresAt: Date.now() + TTL_MS,
      items,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function getItemTitle(formData: StorylineFormData, fallback: string): string {
  const t = (formData.sections?.TITLE ?? "").trim();
  const s = (formData.sections?.SUBTITLE ?? "").trim();
  return t || s || fallback;
}
