"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Ellipsis } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  primaryNavItems,
  moreNavItems,
  isNavItemActive,
} from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

function TabItem({
  active,
  icon: Icon,
  label,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <>
      <span
        className={cn(
          "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
          active && "bg-primary/15"
        )}
      >
        <Icon
          className={cn(
            "size-5 shrink-0",
            active ? "text-primary" : "text-muted-foreground"
          )}
          strokeWidth={active ? 2.4 : 2}
        />
      </span>
      <span
        className={cn(
          "max-w-full truncate px-1 text-[11px] font-medium leading-none",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </>
  );
}

export function BottomNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreNavItems.some(({ href }) =>
    isNavItemActive(pathname, href)
  );

  return (
    <nav
      aria-label={t("common.more")}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid grid-cols-5">
        {primaryNavItems.map(({ href, labelKey, icon }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex min-h-[56px] flex-col items-center justify-center gap-1 touch-manipulation active:bg-muted/60"
            >
              <TabItem active={active} icon={icon} label={t(labelKey)} />
            </Link>
          );
        })}

        <button
          type="button"
          aria-label={t("common.more")}
          aria-expanded={moreOpen}
          className="flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-1 touch-manipulation active:bg-muted/60"
          onClick={() => setMoreOpen(true)}
        >
          <TabItem active={moreActive} icon={Ellipsis} label={t("common.more")} />
        </button>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" showCloseButton={false}>
          <SheetHeader className="px-4 pt-1 pb-0">
            <SheetTitle className="text-base">{t("common.more")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-4">
            {moreNavItems.map(({ href, labelKey, icon: Icon }) => {
              const active = isNavItemActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[48px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors touch-manipulation",
                    active ? "bg-primary/10 text-primary" : "active:bg-muted"
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {t(labelKey)}
                </Link>
              );
            })}

            <div className="mt-2 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("common.language")}
                </span>
                <LocaleSwitcher />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("common.theme")}
                </span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
