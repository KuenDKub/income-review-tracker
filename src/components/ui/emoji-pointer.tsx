"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI Pointer (emoji variant) — replaces the cursor with a floating emoji
 * while the pointer is over the nearest positioned ancestor. Drop it inside a
 * `relative` container; it hides the native cursor only within that region and
 * does nothing on touch devices (no mousemove → stays hidden).
 */
export function EmojiPointer({
  emoji = "✨",
  className,
}: {
  emoji?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    parent.style.cursor = "none";
    const move = (e: MouseEvent) => {
      const r = parent.getBoundingClientRect();
      setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
    };
    const leave = () => setPos(null);
    parent.addEventListener("mousemove", move);
    parent.addEventListener("mouseleave", leave);
    return () => {
      parent.style.cursor = "";
      parent.removeEventListener("mousemove", move);
      parent.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden
      style={{ left: pos?.x ?? 0, top: pos?.y ?? 0, opacity: pos ? 1 : 0 }}
      className={cn(
        "pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2 select-none text-2xl transition-opacity duration-200 motion-safe:duration-200 will-change-transform",
        "drop-shadow-[0_2px_6px_rgba(190,80,130,0.35)]",
        className,
      )}
    >
      {emoji}
    </span>
  );
}
