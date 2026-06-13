"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Sheet({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <DialogPrimitive.Root data-slot="sheet" {...props} />
  );
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
  );
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return (
    <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
  );
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  );
}

type SheetContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> & {
  side?: "left" | "right" | "bottom";
  showCloseButton?: boolean;
};

function SheetContent({
  className,
  children,
  side = "left",
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  const t = useTranslations("common");
  return (
    <SheetPortal data-slot="sheet-portal">
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background fixed z-50 flex flex-col gap-4 shadow-lg transition-transform duration-200 ease-out outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          side === "left" &&
            "left-0 top-0 h-full w-[280px] max-w-[85vw] border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          side === "right" &&
            "right-0 top-0 h-full w-[280px] max-w-[85vw] border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-2xl border-t border-border pb-[env(safe-area-inset-bottom)] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        {...props}
      >
        {side === "bottom" && (
          <div
            aria-hidden
            className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30"
          />
        )}
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon className="size-5" />
            <span className="sr-only">{t("close")}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2 px-6 pt-6", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetPortal, SheetOverlay, SheetContent, SheetHeader, SheetTitle };
