"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI Meteors — streaks that shoot diagonally across the container on a
 * loop. CSS-only (keyframe `meteor` in globals.css); positions/delays are
 * randomized on the client after mount so SSR markup stays stable. Drop it into
 * a `relative overflow-hidden` parent. Themed rose for the portfolio.
 */
export function Meteors({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}) {
  const [styles, setStyles] = useState<CSSProperties[]>([]);

  useEffect(() => {
    setStyles(
      Array.from({ length: number }, () => ({
        "--angle": `${-angle}deg`,
        top: "-5%",
        left: `${Math.floor(Math.random() * window.innerWidth)}px`,
        animationDelay: `${Math.random() * (maxDelay - minDelay) + minDelay}s`,
        animationDuration: `${
          Math.floor(Math.random() * (maxDuration - minDuration) + minDuration)
        }s`,
      })) as CSSProperties[],
    );
  }, [number, minDelay, maxDelay, minDuration, maxDuration, angle]);

  return (
    <>
      {styles.map((style, idx) => (
        <span
          key={idx}
          aria-hidden
          style={style}
          className={cn(
            "pointer-events-none absolute size-0.5 rotate-[var(--angle)] animate-meteor rounded-full bg-rose-300 shadow-[0_0_0_1px_#fb718533]",
            className,
          )}
        >
          {/* Meteor tail */}
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-rose-300 to-transparent" />
        </span>
      ))}
    </>
  );
}
