import { getTranslations } from "next-intl/server";
import { getProfile } from "@/controllers/profileController";
import { getPortfolioData } from "@/controllers/portfolioController";
import { PortfolioView } from "@/components/portfolio/PortfolioView";

export const dynamic = "force-dynamic";

export default async function PublicPortfolioPage() {
  const t = await getTranslations("portfolio");
  const [profile, data] = await Promise.all([getProfile(), getPortfolioData()]);

  if (!profile.isPublic) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">{t("privateNotice")}</p>
      </div>
    );
  }

  return <PortfolioView profile={profile} data={data} />;
}
