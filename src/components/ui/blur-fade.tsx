"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI BlurFade — fades + un-blurs + slides its children up the first time
 * they scroll into view (IntersectionObserver + CSS transition, no
 * framer-motion). Renders fully visible under prefers-reduced-motion.
 */
export function BlurFade({
  children,
  className,
  delay = 0,
  yOffset = 8,
  blur = "8px",
  duration = 500,
  inViewMargin = "-40px",
}: {
  children: React.ReactNode;
  className?: string;
  /** Delay before the transition starts, in ms. */
  delay?: number;
  /** How far (px) it slides up from. */
  yOffset?: number;
  /** Initial blur amount. */
  blur?: string;
  /** Transition length, in ms. */
  duration?: number;
  /** rootMargin for the trigger. */
  inViewMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
      { rootMargin: `0px 0px ${inViewMargin} 0px`, threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inViewMargin]);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        opacity: shown ? 1 : 0,
        filter: shown ? "blur(0px)" : `blur(${blur})`,
        transform: shown ? "translateY(0)" : `translateY(${yOffset}px)`,
      }}
      className={cn(
        "motion-safe:transition-all motion-safe:ease-out",
        className,
      )}
    >
      {children}
    </div>
  );
}
