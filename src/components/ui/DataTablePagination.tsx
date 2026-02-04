"use client";

import * as React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function getPageItems(page: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const items: Array<number | "…"> = [];
  const showLeftEllipsis = page > 4;
  const showRightEllipsis = page < totalPages - 3;

  items.push(1);

  if (showLeftEllipsis) items.push("…");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let p = start; p <= end; p++) items.push(p);

  if (showRightEllipsis) items.push("…");

  items.push(totalPages);
  return items;
}

export type DataTablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  rowsLabel?: string;
  ofLabel?: string;
  className?: string;
};

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  rowsLabel = "Rows",
  ofLabel = "of",
  className,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, (safePage - 1) * pageSize + pageSize);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  return (
    <div className={cn("flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="text-muted-foreground text-sm">
        {from}-{to} {ofLabel} {total}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground text-sm">{rowsLabel}</div>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger size="sm" className="w-[84px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={!canPrev}
                onClick={() => canPrev && onPageChange(safePage - 1)}
              />
            </PaginationItem>

            {getPageItems(safePage, totalPages).map((it, idx) =>
              it === "…" ? (
                <PaginationItem key={`e-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={it}>
                  <PaginationLink
                    isActive={it === safePage}
                    onClick={() => onPageChange(it)}
                  >
                    {it}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                disabled={!canNext}
                onClick={() => canNext && onPageChange(safePage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

