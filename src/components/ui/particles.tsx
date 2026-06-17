"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef } from "react";

type Circle = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

function hexToRgb(hex: string): number[] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const int = parseInt(h, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/**
 * Magic UI Particles — a drifting, mouse-reactive particle field on a canvas
 * (no framer-motion; canvas + requestAnimationFrame). Meant to sit behind
 * content as a `pointer-events-none` backdrop. Renders a single static frame
 * when the visitor prefers reduced motion.
 */
export function Particles({
  className,
  quantity = 80,
  staticity = 50,
  ease = 50,
  size = 0.5,
  color = "#ffffff",
  vx = 0,
  vy = 0,
}: {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  color?: string;
  vx?: number;
  vy?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const canvasSize = useRef({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  const rgb = useRef(hexToRgb(color));
  rgb.current = hexToRgb(color);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !container || !ctx) return;
    canvasSize.current.w = container.offsetWidth;
    canvasSize.current.h = container.offsetHeight;
    canvas.width = canvasSize.current.w * dpr;
    canvas.height = canvasSize.current.h * dpr;
    canvas.style.width = `${canvasSize.current.w}px`;
    canvas.style.height = `${canvasSize.current.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [dpr]);

  const makeCircle = useCallback((): Circle => {
    const { w, h } = canvasSize.current;
    return {
      x: Math.floor(Math.random() * w),
      y: Math.floor(Math.random() * h),
      translateX: 0,
      translateY: 0,
      size: Math.floor(Math.random() * 2) + size,
      alpha: 0,
      targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4,
    };
  }, [size]);

  const drawCircle = useCallback(
    (circle: Circle, update = false) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.translate(circle.translateX, circle.translateY);
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.size, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${rgb.current.join(", ")}, ${circle.alpha})`;
      ctx.fill();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!update) circles.current.push(circle);
    },
    [dpr],
  );

  const clear = useCallback(() => {
    ctxRef.current?.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
  }, []);

  const seed = useCallback(() => {
    clear();
    circles.current = [];
    for (let i = 0; i < quantity; i++) drawCircle(makeCircle());
  }, [clear, drawCircle, makeCircle, quantity]);

  const animate = useCallback(() => {
    clear();
    circles.current.forEach((circle, i) => {
      const edges = [
        circle.x + circle.translateX - circle.size,
        canvasSize.current.w - circle.x - circle.translateX - circle.size,
        circle.y + circle.translateY - circle.size,
        canvasSize.current.h - circle.y - circle.translateY - circle.size,
      ];
      const closest = Math.min(...edges);
      const remap = Math.max(0, parseFloat(((closest * 1) / 20).toFixed(2)));
      if (remap > 1) {
        circle.alpha = Math.min(circle.alpha + 0.02, circle.targetAlpha);
      } else {
        circle.alpha = circle.targetAlpha * remap;
      }
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;
      circle.translateX +=
        (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) /
        ease;
      circle.translateY +=
        (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) /
        ease;
      drawCircle(circle, true);
      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        circles.current.splice(i, 1);
        drawCircle(makeCircle());
      }
    });
    rafRef.current = window.requestAnimationFrame(animate);
  }, [clear, drawCircle, ease, makeCircle, staticity, vx, vy]);

  useEffect(() => {
    if (!canvasRef.current) return;
    ctxRef.current = canvasRef.current.getContext("2d");
    resize();
    seed();

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!reduced) animate();

    const onResize = () => {
      resize();
      seed();
    };
    const onMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left - canvasSize.current.w / 2;
      mouse.current.y = e.clientY - rect.top - canvasSize.current.h / 2;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} aria-hidden className={cn("pointer-events-none", className)}>
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
