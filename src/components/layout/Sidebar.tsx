"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { LayoutDashboard, Briefcase, Wallet, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/jobs", labelKey: "jobs", icon: Briefcase },
  { href: "/income", labelKey: "income", icon: Wallet },
  { href: "/tax", labelKey: "tax", icon: Receipt },
] as const;

type SidebarProps = {
  labels: Record<string, string>;
};

export function Sidebar({ labels }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-16 border-r bg-muted/30 p-3 lg:block xl:w-56 xl:p-4">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          const label = labels[labelKey] ?? labelKey;
          return (
            <Link
              key={href}
              href={href === "/" ? "/" : href}
              title={label}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors xl:justify-start",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
