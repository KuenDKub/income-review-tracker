"use client";

import { Badge } from "@/components/ui/badge";
import { Facebook, Globe, Instagram, Twitter, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_BADGE_CLASS: Record<string, string> = {
  TikTok:
    "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  YouTube:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  Instagram:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  Lemon8:
    "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300 border-lime-200 dark:border-lime-800",
  Facebook:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Twitter:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  "Twitter/X":
    "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  Other: "bg-muted text-muted-foreground border-border",
};

const DEFAULT_BADGE_CLASS = "bg-muted text-muted-foreground border-border";

const ICON_CLASS = "size-3.5 shrink-0";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(className)}
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  TikTok: <TikTokIcon className={ICON_CLASS} />,
  YouTube: <Youtube className={ICON_CLASS} />,
  Instagram: <Instagram className={ICON_CLASS} />,
  Lemon8: <Globe className={ICON_CLASS} />,
  Facebook: <Facebook className={ICON_CLASS} />,
  Twitter: <Twitter className={ICON_CLASS} />,
  "Twitter/X": <Twitter className={ICON_CLASS} />,
  Other: <Globe className={ICON_CLASS} />,
};

function getPlatformIcon(platform: string): React.ReactNode {
  return PLATFORM_ICONS[platform] ?? <Globe className={ICON_CLASS} />;
}

type PlatformBadgesProps = {
  platforms: string[];
  className?: string;
};

export function PlatformBadges({ platforms, className }: PlatformBadgesProps) {
  if (!platforms?.length) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {platforms.map((p) => (
        <Badge
          key={p}
          variant="outline"
          className={cn(
            "text-xs border gap-1",
            PLATFORM_BADGE_CLASS[p] ?? DEFAULT_BADGE_CLASS,
          )}
        >
          {getPlatformIcon(p)}
          <span>{p}</span>
        </Badge>
      ))}
    </div>
  );
}
