"use client";

import { useSyncExternalStore } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronsLeft, ChevronsRight, Sparkles } from "lucide-react";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PushToggle } from "@/components/push/PushToggle";
import { navGroups, isNavItemActive } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import Image from "next/image";

const COLLAPSE_KEY = "sidebar-collapsed";

let collapseListeners: Array<() => void> = [];

function subscribeCollapsed(onStoreChange: () => void) {
  collapseListeners.push(onStoreChange);
  return () => {
    collapseListeners = collapseListeners.filter((l) => l !== onStoreChange);
  };
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(next: boolean) {
  try {
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  } catch {
    // storage unavailable
  }
  collapseListeners.forEach((l) => l());
}

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => false,
  );

  const toggleCollapsed = () => writeCollapsed(!collapsed);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-card transition-[width] duration-200 lg:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* Brand */}
      <Link
        href="/"
        title={t("app.title")}
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Image
          src="/icon.png"
          alt="App Icon"
          width={32}
          height={32}
          className="rounded-lg"
        />
        {!collapsed && (
          <span className="min-w-0 truncate text-sm font-bold leading-tight">
            {t("app.title")}
          </span>
        )}
      </Link>

      {/* Nav groups */}
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.labelKey}>
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {t(group.labelKey)}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map(({ href, labelKey, icon: Icon }) => {
                const active = isNavItemActive(pathname, href);
                const label = t(labelKey);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                      />
                    )}
                    <Icon
                      className="size-5 shrink-0"
                      strokeWidth={active ? 2.4 : 2}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: notifications + locale + theme + collapse toggle */}
      <div className="shrink-0 space-y-2 border-t p-3">
        {!collapsed && (
          <div className="px-1 pb-1">
            <PushToggle />
          </div>
        )}
        {collapsed ? (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-1">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
          className={cn(
            "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <>
              <ChevronsLeft className="size-4" />
              {t("nav.collapse")}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
