import { cn } from "@/lib/utils";

/**
 * Magic UI AuroraText — text painted with a slowly drifting gradient so the
 * fill shimmers like an aurora. CSS-only (see `.aurora-text` in globals.css);
 * the drift is paused automatically under prefers-reduced-motion, leaving a
 * static gradient. Defaults to the portfolio's rose → pink → fuchsia signature.
 */
export function AuroraText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "aurora-text bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
