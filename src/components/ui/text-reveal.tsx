"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI TextReveal ("gradient wipe") — a soft wipe sweeps left-to-right
 * across the whole line, dissolving it into view the first time it scrolls
 * into view (IntersectionObserver + a CSS transition, no framer-motion and no
 * giant scroll section).
 *
 * The text is animated as a single element (not split per word) so the natural
 * spacing is preserved — important for Thai, which marks word boundaries with
 * spaces and shouldn't be broken into separate boxes. The reveal uses clip-path
 * rather than blur/scale so it's safe for scripts with stacked marks (Thai
 * vowels & tone marks above/below the baseline): the clip is expanded a full
 * box-height vertically so those marks are never clipped, and only the right
 * edge animates. Shows everything solid immediately under reduced motion.
 */
export function TextReveal({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <p ref={ref} aria-label={children} className="text-center">
      {/* One element carries the gradient/clip and the wipe together, so the
          whole tagline reveals as a single continuous piece of text. */}
      <span
        aria-hidden
        style={{
          opacity: shown ? 1 : 0,
          // A wipe sweeps in from the left: the right inset animates 100% → 0%
          // while top/bottom stay expanded a full box-height (-100%) so the
          // clip never touches the vertical edges — stacked Thai marks far
          // above (tone/vowel) and below the glyph box stay fully visible.
          // A small upward drift adds life without scaling (which would
          // distort/clip those marks).
          clipPath: shown
            ? "inset(-100% 0% -100% 0%)"
            : "inset(-100% 100% -100% 0%)",
          transform: shown ? "translateY(0)" : "translateY(0.25em)",
        }}
        className={cn(
          // A longer, gentle ease-out for a soft, flowing sweep that suits the
          // elegant italic statement.
          "inline-block will-change-[clip-path,transform,opacity] motion-safe:transition-all motion-safe:duration-[1100ms] motion-safe:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
          className,
        )}
      >
        {children}
      </span>
    </p>
  );
}
