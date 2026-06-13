"use client";

import { cn } from "@/lib/utils";

type TaxPeriodSelectorProps = {
  selectedYear?: number;
  selectedMonth?: number;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
};

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];
const months = Array.from({ length: 12 }, (_, i) => i + 1);

function Segmented<T extends number>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border bg-card p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          className={cn(
            "min-h-[36px] cursor-pointer touch-manipulation rounded-md px-3.5 text-sm font-medium transition-colors active:scale-[0.97]",
            option === value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function TaxPeriodSelector({
  selectedYear = currentYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}: TaxPeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {onYearChange && (
        <Segmented options={years} value={selectedYear} onChange={onYearChange} />
      )}
      {selectedMonth !== undefined && onMonthChange && (
        <Segmented
          options={months}
          value={selectedMonth}
          onChange={onMonthChange}
        />
      )}
    </div>
  );
}
