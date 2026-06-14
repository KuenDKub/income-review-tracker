"use client";

import { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
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
  /** True while a card is being dragged — chips become drop targets. */
  dragging?: boolean;
  className?: string;
};

function StatusChip({
  item,
  index,
  active,
  dragging,
  onSelect,
  setRef,
}: {
  item: ChipItem;
  index: number;
  active: boolean;
  dragging: boolean;
  onSelect: (index: number) => void;
  setRef: (index: number, el: HTMLButtonElement | null) => void;
}) {
  const { status, label, count } = item;
  const theme = statusTheme(status);
  // Unique id so it doesn't clash with the column droppable that uses `status`.
  const { setNodeRef, isOver } = useDroppable({
    id: `chip-${status}`,
    data: { status },
  });

  return (
    <button
      ref={(el) => {
        setNodeRef(el);
        setRef(index, el);
      }}
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        "inline-flex shrink-0 cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-all active:scale-[0.97]",
        // Bigger touch/drop target while a drag is in progress.
        dragging ? "min-h-[48px]" : "min-h-[40px]",
        dragging && "border-dashed",
        active && !dragging
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
        isOver &&
          "scale-105 border-solid border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
      )}
      onClick={() => onSelect(index)}
    >
      <span aria-hidden className={cn("size-2 rounded-full", theme.dot)} />
      <span className="max-w-[14ch] truncate">{label}</span>
      <span className="tabular-nums opacity-80">{count}</span>
    </button>
  );
}

export function StatusChipBar({
  items,
  activeIndex,
  onSelect,
  dragging = false,
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
        // Keep targets reachable while dragging even though snap is off.
        dragging && "rounded-lg bg-muted/40 p-1",
        className
      )}
    >
      {items.map((item, index) => (
        <StatusChip
          key={item.status}
          item={item}
          index={index}
          active={index === activeIndex}
          dragging={dragging}
          onSelect={onSelect}
          setRef={(i, el) => {
            chipRefs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}
