import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";

/**
 * App chrome (sidebar + header + bottom nav) for the authenticated workspace.
 * Lives in the (dashboard) group so public routes (e.g. the shared portfolio)
 * can render without it.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("app");

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-muted/30 dark:bg-background">
        <Header title={t("title")} />
        <main className="flex min-w-0 flex-1 flex-col p-4 pb-[calc(9rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-8">
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
  );
}
