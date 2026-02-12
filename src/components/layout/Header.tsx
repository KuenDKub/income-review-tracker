"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { navItems } from "@/components/layout/Sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLabels = {
  dashboard: string;
  jobs: string;
  income: string;
  tax: string;
};

type HeaderProps = {
  title?: string;
  navLabels?: NavLabels;
};

const defaultNavLabels: NavLabels = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  income: "Income",
  tax: "Tax",
};

export function Header({
  title = "Review Income & Tax Tracker",
  navLabels = defaultNavLabels,
}: HeaderProps) {
  const labels = { ...defaultNavLabels, ...navLabels };
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  return (
    <header className="border-b bg-card px-4 py-4 sm:px-6">
      <div className="flex min-h-[44px] items-center justify-between gap-4">
        <Link href="/" className="min-w-0 shrink-0">
          <span className="text-lg font-semibold truncate">{title}</span>
        </Link>

        {/* Desktop nav: visible from lg up */}
        <nav className="hidden shrink-0 gap-2 lg:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">{labels.dashboard}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/jobs">{labels.jobs}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/income">{labels.income}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tax">{labels.tax}</Link>
          </Button>
        </nav>

        {/* Mobile/tablet: hamburger opens sheet */}
        <div className="shrink-0 lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 min-w-11 touch-manipulation"
              aria-label="Open menu"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
            >
              <Menu className="size-6" />
            </Button>
            <SheetContent side="left" className="p-0">
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {navItems.map(({ href, labelKey, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href === "/" ? "/" : href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors touch-manipulation",
                      pathname === href || (href !== "/" && pathname.startsWith(href))
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    {labels[labelKey] ?? labelKey}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
