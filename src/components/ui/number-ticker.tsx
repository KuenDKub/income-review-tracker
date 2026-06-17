"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI NumberTicker — counts up to `value` the first time it scrolls into
 * view (cubic ease-out via requestAnimationFrame, no framer-motion to match the
 * rest of this codebase). Renders the final value immediately when the visitor
 * prefers reduced motion.
 */
export function NumberTicker({
  value,
  className,
  duration = 1400,
  delay = 0,
}: {
  value: number;
  className?: string;
  /** Count-up length in ms. */
  duration?: number;
  /** Delay before the count starts, in ms. */
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // Reduced motion: skip the count-up, just reveal the final value.
        if (reduced) {
          setDisplay(value);
          return;
        }
        const start = performance.now() + delay;
        const tick = (now: number) => {
          const t = Math.min(1, Math.max(0, (now - start) / duration));
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(eased * value));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)}>
      {display.toLocaleString("en-US")}
    </span>
  );
}
