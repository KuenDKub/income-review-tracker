"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", labelKey: "dashboard" },
  { href: "/jobs", labelKey: "jobs" },
  { href: "/income", labelKey: "income" },
  { href: "/tax", labelKey: "tax" },
] as const;

type SidebarProps = {
  labels: Record<string, string>;
};

export function Sidebar({ labels }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-muted/30 p-4">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, labelKey }) => (
          <Link
            key={href}
            href={href === "/" ? "/" : href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {labels[labelKey] ?? labelKey}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
