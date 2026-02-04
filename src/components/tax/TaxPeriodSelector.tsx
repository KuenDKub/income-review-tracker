"use client";

import { Button } from "@/components/ui/button";

type TaxPeriodSelectorProps = {
  selectedYear?: number;
  selectedMonth?: number;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
};

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];
const months = Array.from({ length: 12 }, (_, i) => i + 1);

export function TaxPeriodSelector({
  selectedYear = currentYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}: TaxPeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex gap-2">
        {years.map((year) => (
          <Button
            key={year}
            variant={selectedYear === year ? "default" : "outline"}
            size="sm"
            onClick={() => onYearChange?.(year)}
          >
            {year}
          </Button>
        ))}
      </div>
      {selectedMonth !== undefined && onMonthChange && (
        <div className="flex gap-2">
          {months.map((month) => (
            <Button
              key={month}
              variant={selectedMonth === month ? "default" : "outline"}
              size="sm"
              onClick={() => onMonthChange?.(month)}
            >
              {month}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
