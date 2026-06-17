"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
}

function Star({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 21 21" fill={color} className="size-full">
      <path d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z" />
    </svg>
  );
}

/**
 * Magic UI SparklesText — wraps text in twinkling star sparkles that fade and
 * scale on a loop (CSS keyframe `sparkle-spin` in globals.css). Sparkle
 * positions are randomized on the client after mount (so SSR markup stays
 * stable), and the twinkle pauses under prefers-reduced-motion.
 */
export function SparklesText({
  children,
  className,
  count = 8,
  colors = ["#fb7185", "#f9a8d4", "#e879f9"],
}: {
  children: React.ReactNode;
  className?: string;
  /** Number of sparkles. */
  count?: number;
  colors?: string[];
}) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const gen = (): Sparkle => ({
      id: `${Math.random()}`,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      scale: Math.random() * 0.6 + 0.5,
    });
    setSparkles(Array.from({ length: count }, gen));
    // colors/count are config; intentionally seed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className="relative inline-block">
      {sparkles.map((s) => (
        <span
          key={s.id}
          aria-hidden
          className="pointer-events-none absolute z-10 size-3 motion-safe:animate-sparkle-spin"
          style={
            {
              left: s.x,
              top: s.y,
              animationDelay: `${s.delay}s`,
              transform: `scale(${s.scale})`,
            } as CSSProperties
          }
        >
          <Star color={s.color} />
        </span>
      ))}
      {/* Gradient/clip lives on the text element itself so background-clip:text
          has glyphs to clip to. */}
      <strong className={cn("relative z-0 font-[inherit]", className)}>
        {children}
      </strong>
    </span>
  );
}
