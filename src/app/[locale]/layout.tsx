import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { NuqsAdapter } from "nuqs/adapters/next/app";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("app");

  return (
    <NextIntlClientProvider>
      <NuqsAdapter>
        <div className="flex min-h-dvh">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col bg-muted/30 dark:bg-background">
            <Header title={t("title")} />
            <main className="flex min-w-0 flex-1 flex-col p-4 pb-24 sm:p-6 lg:pb-8">
              <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
                {children}
              </div>
            </main>
            <div className="hidden lg:block">
              <Footer />
            </div>
            <BottomNav />
          </div>
        </div>
      </NuqsAdapter>
    </NextIntlClientProvider>
  );
}
