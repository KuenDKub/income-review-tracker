"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const MORPH_TIME = 1.4;
const COOLDOWN_TIME = 1.2;

/**
 * Magic UI MorphingText — cross-morphs through a list of strings using a blur +
 * opacity transition driven by requestAnimationFrame (no framer-motion). Under
 * reduced motion it simply shows the first string.
 */
export function MorphingText({
  texts,
  className,
}: {
  texts: string[];
  className?: string;
}) {
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(0);
  const timeRef = useRef(new Date());

  const setStyles = useCallback(
    (fraction: number) => {
      const t1 = text1Ref.current;
      const t2 = text2Ref.current;
      if (!t1 || !t2 || texts.length === 0) return;

      const i = indexRef.current;
      t2.textContent = texts[i % texts.length];
      t1.textContent = texts[(i + texts.length - 1) % texts.length];

      const f2 = Math.min(1, Math.max(0.0001, fraction));
      t2.style.filter = `blur(${Math.min(8 / f2 - 8, 100)}px)`;
      t2.style.opacity = `${Math.pow(f2, 0.4) * 100}%`;

      const inv = 1 - f2;
      const f1 = Math.min(1, Math.max(0.0001, inv));
      t1.style.filter = `blur(${Math.min(8 / f1 - 8, 100)}px)`;
      t1.style.opacity = `${Math.pow(f1, 0.4) * 100}%`;
    },
    [texts],
  );

  useEffect(() => {
    if (texts.length === 0) return;
    const t1 = text1Ref.current;
    const t2 = text2Ref.current;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      if (t2) {
        t2.textContent = texts[0];
        t2.style.opacity = "100%";
        t2.style.filter = "none";
      }
      if (t1) t1.style.opacity = "0%";
      return;
    }

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = new Date();
      const dt = (now.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current = now;

      cooldownRef.current -= dt;
      if (cooldownRef.current <= 0) {
        if (morphRef.current === 0) indexRef.current++;
        morphRef.current += dt;
        let fraction = morphRef.current / MORPH_TIME;
        if (fraction >= 1) {
          morphRef.current = 0;
          cooldownRef.current = COOLDOWN_TIME;
          fraction = 1;
        }
        setStyles(fraction);
      } else {
        setStyles(1);
      }
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, [setStyles, texts]);

  return (
    <span
      className={cn(
        "relative inline-block align-baseline [filter:url(#morph-threshold)]",
        className,
      )}
    >
      <span ref={text1Ref} className="absolute inset-0 inline-block" />
      <span ref={text2Ref} className="inline-block" />
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <filter id="morph-threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>
    </span>
  );
}
