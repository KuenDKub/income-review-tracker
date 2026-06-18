import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Labelled read-only value tile used across the job detail sections. */
export function DetailItem({
  label,
  children,
  icon,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-muted/20 p-3", className)}>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 min-h-5 text-sm font-medium">{children}</dd>
    </div>
  );
}
