"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Floating action button for the primary create action on mobile.
 * Sits above the bottom navigation; hidden on desktop where the
 * header button is available.
 */
export function Fab({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      size="icon"
      className={cn(
        "fixed right-4 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-lg lg:hidden",
        className
      )}
      {...props}
    >
      {children ?? <Plus className="size-6" />}
    </Button>
  );
}
