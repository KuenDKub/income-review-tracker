"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI PixelImage — reveals an image as a grid of pixel tiles that pop in
 * with staggered, randomized delays the first time it scrolls into view
 * (CSS transitions, no framer-motion). Shows the full image immediately under
 * reduced motion.
 *
 * The host should size + clip this element (e.g. a `size-24 rounded-full
 * overflow-hidden` wrapper) — the tiles fill it via `inset-0`.
 */
export function PixelImage({
  src,
  alt = "",
  grid = 7,
  className,
}: {
  src: string;
  alt?: string;
  /** Tiles per row/column. */
  grid?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  // Randomized per-tile delays, seeded once on the client.
  const [delays, setDelays] = useState<number[]>([]);

  useEffect(() => {
    setDelays(
      Array.from({ length: grid * grid }, () => Math.random() * 600),
    );
  }, [grid]);

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
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cells = delays.length ? delays : Array.from({ length: grid * grid }, () => 0);

  return (
    <div ref={ref} className={cn("relative size-full overflow-hidden", className)}>
      {/* Accessible image for SR / fallback if JS-less. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="absolute inset-0 size-full object-cover opacity-0" />
      <div
        className="grid size-full"
        style={{
          gridTemplateColumns: `repeat(${grid}, 1fr)`,
          gridTemplateRows: `repeat(${grid}, 1fr)`,
        }}
      >
        {cells.map((delay, i) => {
          const col = i % grid;
          const row = Math.floor(i / grid);
          return (
            <span
              key={i}
              aria-hidden
              style={
                {
                  backgroundImage: `url(${src})`,
                  backgroundSize: `${grid * 100}% ${grid * 100}%`,
                  backgroundPosition: `${(col / (grid - 1)) * 100}% ${(row / (grid - 1)) * 100}%`,
                  transitionDelay: `${delay}ms`,
                  opacity: shown ? 1 : 0,
                  transform: shown ? "scale(1)" : "scale(0.4)",
                } as CSSProperties
              }
              className="size-full motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out"
            />
          );
        })}
      </div>
    </div>
  );
}
