import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { RateCardClient } from "@/components/rate-card/RateCardClient";

export default async function RateCardPage() {
  const t = await getTranslations("rateCard");
  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <RateCardClient />
    </div>
  );
}
