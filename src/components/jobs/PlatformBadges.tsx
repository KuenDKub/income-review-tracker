"use client";

import { Badge } from "@/components/ui/badge";
import { Globe, Instagram, Twitter, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

/** Official brand colors: background and text per platform */
const PLATFORM_BADGE_CLASS: Record<string, string> = {
  TikTok:
    "bg-[#000000] text-[#FFFFFF] border-[#000000] dark:bg-[#000000] dark:text-[#FFFFFF] dark:border-white/20",
  YouTube:
    "bg-[#FF0000] text-[#FFFFFF] border-[#CC0000] dark:bg-[#FF0000] dark:text-[#FFFFFF] dark:border-[#CC0000]",
  Instagram:
    "bg-[#E1306C] text-[#FFFFFF] border-[#E1306C] dark:bg-[#E1306C] dark:text-[#FFFFFF] dark:border-[#E1306C]/80",
  Facebook:
    "bg-[#1877F2] text-[#FFFFFF] border-[#1877F2] dark:bg-[#1877F2] dark:text-[#FFFFFF] dark:border-[#1877F2]/80",
  Twitter:
    "bg-[#1DA1F2] text-[#FFFFFF] border-[#1DA1F2] dark:bg-[#1DA1F2] dark:text-[#FFFFFF] dark:border-[#1DA1F2]/80",
  "Twitter/X":
    "bg-[#1DA1F2] text-[#FFFFFF] border-[#1DA1F2] dark:bg-[#1DA1F2] dark:text-[#FFFFFF] dark:border-[#1DA1F2]/80",
  Lemon8:
    "bg-[#F5E642] text-[#000000] border-[#F5E642] dark:bg-[#F5E642] dark:text-[#000000] dark:border-[#F5E642]/80",
  Other:
    "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB] dark:bg-[#374151] dark:text-[#F3F4F6] dark:border-[#4B5563]",
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

/** Official Facebook "f" logo (letter only, for use on colored badge) */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(className)}
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5L14.5.5C10.5.5 9 3.44 9 6.32v1.15h-3v4h3v12h5v-12h3.85l.92-4z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  TikTok: <TikTokIcon className={ICON_CLASS} />,
  YouTube: <Youtube className={ICON_CLASS} />,
  Instagram: <Instagram className={ICON_CLASS} />,
  Lemon8: <Globe className={ICON_CLASS} />,
  Facebook: <FacebookIcon className={ICON_CLASS} />,
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
