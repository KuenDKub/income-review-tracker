import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

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

  const messages = await getMessages();
  const t = await getTranslations("app");
  const navLabels = {
    dashboard: (await getTranslations("dashboard"))("title"),
    jobs: (await getTranslations("jobs"))("title"),
    income: (await getTranslations("income"))("title"),
    tax: (await getTranslations("tax"))("title"),
  };

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen flex-col">
        <Header title={t("title")} navLabels={navLabels} />
        <div className="flex flex-1">
          <Sidebar labels={navLabels} />
          <main className="flex-1 p-4 sm:p-6">
            <div className="mb-4 flex justify-end">
              <LocaleSwitcher />
            </div>
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
