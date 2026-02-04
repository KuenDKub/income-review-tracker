import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date for display (YYYY-MM-DD to locale string or keep ISO) */
export function formatDate(isoDate: string | Date | null | undefined): string {
  if (isoDate == null) return "";
  const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
  return d.toISOString().slice(0, 10);
}
