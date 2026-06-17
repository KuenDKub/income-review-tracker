import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI AnimatedGradientText — text filled with a gradient that scrolls
 * horizontally on a loop. CSS-only (`.animate-gradient` in globals.css); the
 * scroll is paused under prefers-reduced-motion. Defaults to the portfolio's
 * rose → fuchsia signature.
 */
export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#fb7185",
  colorTo = "#e879f9",
}: {
  children: React.ReactNode;
  className?: string;
  /** Higher = faster scroll. */
  speed?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <span
      style={
        {
          "--bg-size": `${speed * 300}%`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as CSSProperties
      }
      className={cn(
        "animate-gradient bg-gradient-to-r from-[var(--color-from)] via-[var(--color-to)] to-[var(--color-from)] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
