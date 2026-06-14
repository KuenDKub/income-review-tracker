import { Link } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import Image from "next/image";

type HeaderProps = {
  title?: string;
};

/** Mobile top bar — on desktop the sidebar carries the brand and controls. */
export function Header({ title = "Review Income & Tax Tracker" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
      <div className="flex min-h-14 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 touch-manipulation"
        >
          <Image
            src="/icon.png"
            alt="App Icon"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="truncate text-base font-bold">{title}</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
