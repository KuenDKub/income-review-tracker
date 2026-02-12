"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PaginationLinkSize = React.ComponentProps<typeof Button>["size"];

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  size?: PaginationLinkSize;
} & React.ComponentProps<"button">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      size={size}
      className={cn("h-8 w-8", className)}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const t = useTranslations("ui");
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("h-8 w-8", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">{t("previous")}</span>
    </Button>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const t = useTranslations("ui");
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("h-8 w-8", className)}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">{t("next")}</span>
    </Button>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  const t = useTranslations("ui");
  return (
    <span
      aria-hidden
      className={cn("flex h-8 w-8 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">{t("morePages")}</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};

