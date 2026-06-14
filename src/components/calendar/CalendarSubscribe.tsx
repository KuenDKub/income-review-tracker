"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/lib/toast";
import { CalendarPlus, Check, Copy } from "lucide-react";

type CalendarSubscribeProps = {
  /** Secret token for the feed URL. When empty the control is not rendered. */
  feedToken: string;
};

/**
 * Lets the user subscribe Apple/Google Calendar to a live .ics feed of their
 * jobs. One-way, auto-refreshing: the calendar app re-polls the URL on its own
 * schedule, so new/edited jobs show up without re-importing anything.
 */
export function CalendarSubscribe({ feedToken }: CalendarSubscribeProps) {
  const t = useTranslations("calendar");
  const [copied, setCopied] = useState(false);

  if (!feedToken) return null;

  // Built lazily on interaction so we don't depend on window during render.
  const feedUrl = (scheme: "https" | "webcal") => {
    const origin = window.location.origin;
    const base = `${origin}/api/calendar/feed.ics?token=${encodeURIComponent(feedToken)}`;
    return scheme === "webcal" ? base.replace(/^https?:/, "webcal:") : base;
  };

  function subscribeApple() {
    window.location.href = feedUrl("webcal");
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(feedUrl("https"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("subscribeCopyError"));
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarPlus className="size-4" />
          <span className="hidden sm:inline">{t("subscribe")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">{t("subscribeTitle")}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {t("subscribeHint")}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="justify-start gap-2"
            onClick={subscribeApple}
          >
            <CalendarPlus className="size-4 shrink-0" />
            {t("subscribeApple")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-start gap-2"
            onClick={copyUrl}
          >
            {copied ? (
              <Check className="size-4 shrink-0" />
            ) : (
              <Copy className="size-4 shrink-0" />
            )}
            {copied ? t("subscribeCopied") : t("subscribeCopyUrl")}
          </Button>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            {t("subscribeGoogleHint")}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
