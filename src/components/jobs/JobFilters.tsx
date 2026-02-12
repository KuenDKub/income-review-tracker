"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="max-w-xs"
      />
      {onReset && (
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          {tCommon("reset")}
        </Button>
      )}
    </div>
  );
}
