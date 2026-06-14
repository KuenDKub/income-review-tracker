import { getTranslations } from "next-intl/server";
import { DashboardSummaryWrapper } from "@/components/dashboard/DashboardSummaryWrapper";
import { UpcomingPostsCard } from "@/components/dashboard/UpcomingPostsCard";
import { AwaitingPaymentCard } from "@/components/dashboard/AwaitingPaymentCard";
import { PageHeader } from "@/components/ui/page-header";

export default async function HomePage() {
  const t = await getTranslations("dashboard");
  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <DashboardSummaryWrapper />
      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingPostsCard />
        <AwaitingPaymentCard />
      </div>
    </div>
  );
}
