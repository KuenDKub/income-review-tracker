"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  message: string;
  description?: string;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  message,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12 text-center",
        className
      )}
    >
      <Icon className="h-12 w-12 text-muted-foreground/60" aria-hidden />
      <p className="font-medium text-foreground">{message}</p>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
