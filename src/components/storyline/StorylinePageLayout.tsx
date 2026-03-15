"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import StorylineGenerator, {
  type StorylineFormData,
} from "@/components/storyline/StorylineGenerator";
import {
  readStorylineCache,
  writeStorylineCache,
  getItemTitle,
  type StorylineFormItem,
} from "@/lib/storylineCache";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyFormData(): StorylineFormData {
  return {
    sections: {
      TITLE: "",
      SUBTITLE: "",
      GENRE: "",
      HOOK: "",
      VIBE: "",
      CTA: "",
      CAPTION_IDEA: "",
      DRESS_CODE: "",
    },
    scenesTable: [],
  };
}

export default function StorylinePageLayout() {
  const t = useTranslations("storyline");
  const [items, setItems] = useState<StorylineFormItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cached = readStorylineCache();
    setItems(cached);
    if (cached.length > 0 && !activeId) {
      setActiveId(cached[0].id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorylineCache(items);
  }, [hydrated, items]);

  const handleNewForm = useCallback(() => {
    const id = generateId();
    const newItem: StorylineFormItem = {
      id,
      title: t("newForm"),
      formData: emptyFormData(),
    };
    setItems((prev) => [...prev, newItem]);
    setActiveId(id);
  }, [t]);

  const handleDataChange = useCallback(
    (id: string) => (data: StorylineFormData) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                title: getItemTitle(data, t("newForm")),
                formData: data,
              }
            : it
        )
      );
    },
    [t]
  );

  const handleDeleteForm = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id);
        return next;
      });
      setActiveId((current) => {
        if (current !== id) return current;
        const remaining = items.filter((it) => it.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      });
    },
    [items]
  );

  const activeItem = activeId
    ? items.find((i) => i.id === activeId)
    : null;

  if (!hydrated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {/* Sidebar: New + list (AI chat style) */}
      <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/20 p-3 lg:w-64">
        <Button
          variant="outline"
          className="mb-3 w-full justify-start gap-2"
          onClick={handleNewForm}
        >
          <Plus className="size-4" />
          {t("newChat")}
        </Button>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("myForms")}
        </p>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {items.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              {t("noForms")}
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-1 rounded-md group",
                  activeId === item.id && "bg-primary text-primary-foreground"
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                    activeId === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <MessageSquare className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{item.title}</span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-md opacity-70 hover:opacity-100",
                    activeId === item.id
                      ? "text-primary-foreground hover:bg-primary-foreground/20"
                      : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  )}
                  onClick={(e) => handleDeleteForm(e, item.id)}
                  title={t("deleteForm")}
                  aria-label={t("deleteForm")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </nav>
      </aside>

      {/* Main: form + export */}
      <main className="min-w-0 flex-1">
        {activeItem ? (
          <StorylineGenerator
            key={activeItem.id}
            initialData={activeItem.formData}
            onDataChange={handleDataChange(activeItem.id)}
          />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p>{t("selectOrCreate")}</p>
            <Button onClick={handleNewForm} variant="outline">
              <Plus className="mr-2 size-4" />
              {t("newChat")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
