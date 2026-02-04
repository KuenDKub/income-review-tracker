"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const locales = [
  { code: "th", label: "ไทย" },
  { code: "en", label: "EN" },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex gap-1">
      {locales.map(({ code, label }) => (
        <Button
          key={code}
          variant={locale === code ? "secondary" : "ghost"}
          size="sm"
          onClick={() => router.replace(pathname, { locale: code })}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
