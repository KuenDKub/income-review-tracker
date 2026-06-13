"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { statusTheme } from "./statusTheme";

type ChipItem = {
  status: string;
  label: string;
  count: number;
};

type StatusChipBarProps = {
  items: ChipItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
};

export function StatusChipBar({
  items,
  activeIndex,
  onSelect,
  className,
}: StatusChipBarProps) {
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    chipRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex]);

  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {items.map(({ status, label, count }, index) => {
        const active = index === activeIndex;
        const theme = statusTheme(status);
        return (
          <button
            key={status}
            ref={(el) => {
              chipRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "inline-flex min-h-[40px] shrink-0 cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors active:scale-[0.97]",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            )}
            onClick={() => onSelect(index)}
          >
            <span
              aria-hidden
              className={cn("size-2 rounded-full", theme.dot)}
            />
            <span className="max-w-[14ch] truncate">{label}</span>
            <span className="tabular-nums opacity-80">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
