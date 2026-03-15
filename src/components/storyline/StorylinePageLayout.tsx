"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, MessageSquare, Trash2, PanelLeft } from "lucide-react";
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
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const cached = readStorylineCache();
    queueMicrotask(() => {
      setItems(cached);
      if (cached.length > 0) {
        setActiveId((prev) => prev ?? cached[0].id);
      }
      setHydrated(true);
    });
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

  const openFormListLabel = activeItem
    ? activeItem.title
    : t("openFormList");

  const formListContent = (
    <>
      <Button
        variant="outline"
        className="mb-3 w-full justify-start gap-2 min-h-[44px] touch-manipulation"
        onClick={() => {
          handleNewForm();
          setSheetOpen(false);
        }}
      >
        <Plus className="size-4" />
        {t("newChat")}
      </Button>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("myForms")}
      </p>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto min-h-0">
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
                onClick={() => {
                  setActiveId(item.id);
                  setSheetOpen(false);
                }}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors min-h-[44px] touch-manipulation",
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
                  "h-10 w-10 shrink-0 rounded-md opacity-70 hover:opacity-100 touch-manipulation",
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
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:min-h-0">
      {/* Mobile/tablet: button to open form list sheet */}
      <div className="shrink-0 lg:hidden">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 min-h-[44px] touch-manipulation rounded border-b-0"
          onClick={() => setSheetOpen(true)}
          aria-expanded={sheetOpen}
          aria-label={t("openFormList")}
        >
          <PanelLeft className="size-5 shrink-0" />
          <span className="min-w-0 truncate">{openFormListLabel}</span>
        </Button>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="left"
            className="flex h-full max-h-dvh w-[280px] max-w-[85vw] flex-col gap-4 p-0"
          >
            <SheetHeader className="border-b px-4 py-4 sm:px-6">
              <SheetTitle className="text-base font-semibold">
                {t("myForms")}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden px-4 pb-6 sm:px-6">
              {formListContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sidebar: desktop only (lg+) */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-muted/20 p-3 lg:flex lg:w-64">
        {formListContent}
      </aside>

      {/* Main: form + export */}
      <main className="min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
        {activeItem ? (
          <div className="mx-auto w-full max-w-3xl min-h-0 flex-1 flex flex-col">
            <StorylineGenerator
              key={activeItem.id}
              initialData={activeItem.formData}
              onDataChange={handleDataChange(activeItem.id)}
            />
          </div>
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
