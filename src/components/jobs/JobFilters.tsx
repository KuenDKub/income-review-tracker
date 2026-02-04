"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type JobFiltersProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  onReset?: () => void;
};

export function JobFilters({
  search = "",
  onSearchChange,
  onReset,
}: JobFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        placeholder="Search jobs..."
        value={search}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="max-w-xs"
      />
      {onReset && (
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
}
