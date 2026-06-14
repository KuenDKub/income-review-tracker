import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";

export default async function PortfolioEditPage() {
  const t = await getTranslations("portfolio");
  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <PageHeader title={t("editTitle")} description={t("editSubtitle")} />
      <PortfolioClient />
    </div>
  );
}
