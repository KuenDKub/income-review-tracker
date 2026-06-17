import { cn } from "@/lib/utils";

/**
 * Magic UI ShinyButton — a button with a highlight that sweeps across on hover
 * (CSS-only; the sweep is just a transform transition, so it's inert under
 * reduced motion). Forwards all native button props.
 */
export function ShinyButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "group relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-semibold transition-transform active:scale-[0.98]",
        className,
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
      {/* Diagonal highlight that sweeps across on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[120%]"
      />
    </button>
  );
}
