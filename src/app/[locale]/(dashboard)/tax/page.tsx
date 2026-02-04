import { getTranslations } from "next-intl/server";

export default async function TaxPage() {
  const t = await getTranslations("tax");
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-zinc-600">{t("summaryPlaceholder")}</p>
    </main>
  );
}
