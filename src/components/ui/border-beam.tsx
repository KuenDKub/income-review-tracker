import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI BorderBeam — a gradient streak that travels *along* a card's border
 * line. CSS-only: the beam square rides an `offset-path` rect, and the wrapper's
 * mask (padding-box ∩ border-box) clips it down to just the border ring.
 *
 * The travel is gated behind `@supports (offset-path: rect(...))` (see
 * `.border-beam` in globals.css), so unsupported browsers simply render no beam.
 *
 * Host element must be `relative` with a matching border-radius.
 */
export function BorderBeam({
  className,
  size = 50,
  duration = 8,
  delay = 0,
  borderWidth = 1.5,
  colorFrom = "#fb7185",
  colorTo = "#e879f9",
}: {
  className?: string;
  /** Length of the travelling streak, in px. */
  size?: number;
  /** Time for one full lap, in seconds. */
  duration?: number;
  /** Start offset, in seconds. */
  delay?: number;
  /** Width of the beam line, in px. */
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={
        {
          border: `${borderWidth}px solid transparent`,
          // Clip the beam to the border ring (padding-box ∩ border-box).
          mask: "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
          maskClip: "padding-box, border-box",
          maskComposite: "intersect",
          WebkitMask:
            "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
          WebkitMaskClip: "padding-box, border-box",
          WebkitMaskComposite: "source-in",
        } as CSSProperties
      }
    >
      <span
        className={cn(
          "border-beam absolute aspect-square bg-gradient-to-l from-[var(--beam-from)] via-[var(--beam-to)] to-transparent",
          className,
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            animationDuration: `${duration}s`,
            animationDelay: `${-delay}s`,
            "--beam-from": colorFrom,
            "--beam-to": colorTo,
          } as CSSProperties
        }
      />
    </div>
  );
}
