import {
  LayoutDashboard,
  Briefcase,
  Columns,
  Wallet,
  Receipt,
  Film,
  CalendarDays,
  BadgeDollarSign,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  /** Full next-intl message path, resolved with a root `useTranslations()`. */
  labelKey: string;
  icon: LucideIcon;
};

export type NavGroup = {
  /** Full next-intl message path for the section label. */
  labelKey: string;
  items: readonly NavItem[];
};

/** Top-level destinations, in priority order (board is the core feature). */
export const navItems: readonly NavItem[] = [
  { href: "/", labelKey: "dashboard.title", icon: LayoutDashboard },
  { href: "/jobs-dnd", labelKey: "jobs.board", icon: Columns },
  { href: "/jobs", labelKey: "jobs.title", icon: Briefcase },
  { href: "/income", labelKey: "income.title", icon: Wallet },
  { href: "/calendar", labelKey: "calendar.title", icon: CalendarDays },
  { href: "/tax", labelKey: "tax.title", icon: Receipt },
  { href: "/storyline", labelKey: "storyline.title", icon: Film },
  { href: "/rate-card", labelKey: "rateCard.title", icon: BadgeDollarSign },
  { href: "/portfolio-edit", labelKey: "portfolio.title", icon: Sparkles },
] as const;

/** Sidebar sections (desktop). */
export const navGroups: readonly NavGroup[] = [
  { labelKey: "nav.workspace", items: navItems.slice(0, 4) },
  { labelKey: "nav.tools", items: navItems.slice(4) },
] as const;

/** Shown as tabs in the mobile bottom navigation (max 4 + "More"). */
export const primaryNavItems = navItems.slice(0, 4);

/** Tucked into the "More" sheet on mobile. */
export const moreNavItems = navItems.slice(4);

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}
