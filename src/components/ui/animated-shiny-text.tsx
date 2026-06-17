import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI AnimatedShinyText — a soft highlight sweeps across the text on a
 * loop. CSS-only (`.animate-shiny-text` in globals.css); the sweep is paused
 * under prefers-reduced-motion. The base text colour comes from `text-*` on the
 * element; the moving band is the bright streak.
 */
export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 80,
  shinyColor = "rgba(180,70,120,0.95)",
}: {
  children: React.ReactNode;
  className?: string;
  /** Width of the moving highlight band, in px. */
  shimmerWidth?: number;
  /** Colour of the moving band — should contrast with the base `text-*`. */
  shinyColor?: string;
}) {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
          "--shiny-color": shinyColor,
        } as CSSProperties
      }
      className={cn(
        "animate-shiny-text bg-clip-text [background-position:0_0] [background-repeat:no-repeat] [background-size:var(--shiny-width)_100%]",
        // Mostly-transparent gradient with a bright band in the middle.
        "[background-image:linear-gradient(110deg,transparent_40%,var(--shiny-color)_50%,transparent_60%)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
