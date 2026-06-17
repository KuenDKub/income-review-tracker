"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI TextAnimate — staggers a text in by character or word the first time
 * it scrolls into view. CSS-only stagger (per-token `animation-delay`, keyframe
 * `text-animate-in` in globals.css); shows static text under reduced motion.
 */
export function TextAnimate({
  children,
  className,
  by = "word",
  delay = 0,
  stagger = 50,
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  /** Split granularity. */
  by?: "word" | "char";
  /** Delay before the first token, in ms. */
  delay?: number;
  /** Gap between tokens, in ms. */
  stagger?: number;
  as?: "span" | "p" | "div" | "h2" | "h3";
}) {
  const ref = useRef<HTMLElement>(null);
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
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tokens =
    by === "char" ? Array.from(children) : children.split(/(\s+)/);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("inline-block", className)}
      aria-label={children}
    >
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return token;
        return (
          <span
            key={i}
            aria-hidden
            className={cn(
              "inline-block whitespace-pre",
              shown ? "motion-safe:animate-text-animate-in" : "opacity-0",
            )}
            style={{ animationDelay: `${delay + i * stagger}ms` }}
          >
            {token}
          </span>
        );
      })}
    </Tag>
  );
}
