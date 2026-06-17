"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI TypingAnimation — types the text out one character at a time once it
 * scrolls into view, with a blinking caret. Renders the full string instantly
 * under reduced motion.
 */
export function TypingAnimation({
  text,
  className,
  speed = 60,
  startOnView = true,
  showCaret = true,
}: {
  text: string;
  className?: string;
  /** Per-character delay, in ms. */
  speed?: number;
  /** Wait until scrolled into view to begin. */
  startOnView?: boolean;
  showCaret?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      setDone(true);
      return;
    }

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      timer = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            if (timer) clearInterval(timer);
            setDone(true);
            return c;
          }
          return c + 1;
        });
      }, speed);
    };

    if (!startOnView) {
      start();
      return () => {
        if (timer) clearInterval(timer);
      };
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [text, speed, startOnView]);

  return (
    <span ref={ref} className={cn("inline-block", className)} aria-label={text}>
      <span aria-hidden>{text.slice(0, count)}</span>
      {showCaret && (
        <span
          aria-hidden
          className={cn(
            "ml-0.5 inline-block w-px self-stretch border-r-2 border-current align-middle",
            done ? "motion-safe:animate-caret-blink" : "opacity-100",
          )}
          style={{ height: "1em" }}
        />
      )}
    </span>
  );
}
