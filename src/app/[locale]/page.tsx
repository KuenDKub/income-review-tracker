import { getTranslations } from "next-intl/server";
import { DashboardSummaryWrapper } from "@/components/dashboard/DashboardSummaryWrapper";

export default async function HomePage() {
  const t = await getTranslations("dashboard");
  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>
      <DashboardSummaryWrapper />
    </main>
  );
}
