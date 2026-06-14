"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, Download, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type PortfolioViewData = {
  stats: { totalDeals: number; brandCount: number; platforms: string[]; firstDealYear: number | null };
  rates: Array<{ id: string; platform: string; contentType: string; price: number; currency: string; notes: string | null }>;
  collaborations: Array<{ name: string; dealCount: number; platforms: string[]; contentTypes: string[]; imageUrl: string | null }>;
  gallery: Array<{ id: string; imageUrl: string; title: string; payerName: string | null; platforms: string[]; contentType: string }>;
  platforms: string[];
};
export type PortfolioViewProfile = {
  creatorName: string;
  handle: string;
  tagline: string;
  contactEmail: string | null;
};

// Elegant display serif (loaded in the public layout). Thai falls back to Athiti.
const serif = "font-[family-name:var(--font-playfair)]";
const muted = "text-[#9C5C79] dark:text-[#F6E8EF]/55";
const softCard =
  "rounded-2xl border border-pink-200/60 bg-white/70 shadow-[0_22px_55px_-32px_rgba(236,72,153,0.55)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]";
const gradientText =
  "bg-gradient-to-r from-primary via-fuchsia-500 to-violet-500 bg-clip-text text-transparent";
const glossyBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-violet-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98]";
const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-pink-200/70 bg-white/60 px-7 py-3 text-sm font-semibold transition-colors hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10";

function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-semibold uppercase tracking-[0.24em]", muted, className)}>
      {children}
    </span>
  );
}

export function PortfolioView({
  profile,
  data,
}: {
  profile: PortfolioViewProfile;
  data: PortfolioViewData;
}) {
  const t = useTranslations("portfolio");
  const tRate = useTranslations("rateCard");
  const locale = useLocale();

  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(false);

  const handleAt = profile.handle ? `@${profile.handle.replace(/^@/, "")}` : "";
  const displayName = profile.creatorName.trim() || profile.handle.trim() || t("creatorFallback");

  const filteredGallery = useMemo(
    () => (filter === "all" ? data.gallery : data.gallery.filter((w) => w.platforms.includes(filter))),
    [data.gallery, filter],
  );
  const heroImage = data.gallery[0] ?? null;

  const stats = [
    { label: tRate("statDeals"), value: data.stats.totalDeals },
    { label: tRate("statBrands"), value: data.stats.brandCount },
    { label: tRate("statPlatforms"), value: data.stats.platforms.length },
  ];

  function downloadMediaKit() {
    window.open(`/api/portfolio/media-kit?locale=${locale}`, "_blank");
  }
  async function copyContact() {
    const value = profile.contactEmail || handleAt || displayName;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-primary/20 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute -left-24 top-40 size-[26rem] rounded-full bg-violet-400/20 blur-[120px]" />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Kicker>{handleAt || displayName}</Kicker>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <Kicker className="hidden sm:inline">{t("portfolioLabel")}</Kicker>
          </span>
        </header>

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-10 pb-14 pt-6 sm:pb-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-14">
            <div>
              <Kicker>
                {t("portfolioLabel")}
                {data.stats.firstDealYear ? ` · ${tRate("since")} ${data.stats.firstDealYear}` : ""}
              </Kicker>
              <h1 className={cn(serif, "mt-5 text-[clamp(3rem,10vw,6.5rem)] font-semibold leading-[0.92] tracking-tight")}>
                <span className={gradientText}>{displayName}</span>
              </h1>
              {handleAt && (
                <p className="mt-5 text-base font-medium tracking-wide text-primary">{handleAt}</p>
              )}
              {profile.tagline && (
                <p className={cn(serif, "mt-3 max-w-md text-xl italic leading-snug text-[#6B3350] dark:text-[#F6E8EF]/80")}>
                  {profile.tagline}
                </p>
              )}
              {data.stats.platforms.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {data.stats.platforms.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-pink-200/70 bg-white/60 px-3.5 py-1.5 text-xs font-medium dark:border-white/15 dark:bg-white/5"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={downloadMediaKit} className={glossyBtn}>
                  <Download className="size-4" />
                  {tRate("downloadMediaKit")}
                </button>
                <button type="button" onClick={copyContact} className={ghostBtn}>
                  {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                  {copied ? t("contactCopied") : t("copyContact")}
                </button>
              </div>
            </div>

            {heroImage ? (
              <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
                <div className="absolute -inset-3 -rotate-2 rounded-[2rem] bg-gradient-to-br from-primary/25 to-violet-400/25 blur-xl" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage.imageUrl}
                  alt={displayName}
                  className="relative aspect-[4/5] w-full rounded-[1.75rem] object-cover shadow-2xl shadow-primary/20 ring-1 ring-white/40"
                />
                <div className={cn(softCard, "absolute -bottom-5 -left-3 flex items-center gap-2 rounded-2xl px-4 py-2.5")}>
                  <Sparkles className="size-4 text-primary" />
                  <span className="text-xs font-semibold">{heroImage.payerName ?? heroImage.contentType}</span>
                </div>
              </div>
            ) : (
              <div className="relative hidden lg:flex lg:items-center lg:justify-center">
                <div className={cn(serif, "text-[12rem] leading-none", gradientText)}>
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats ribbon */}
        <div className="relative mx-auto max-w-6xl px-5 pb-4 sm:px-8">
          <div className={cn(softCard, "grid grid-cols-3 overflow-hidden rounded-3xl")}>
            {stats.map((s, i) => (
              <div key={s.label} className={cn("px-3 py-6 text-center sm:py-8", i > 0 && "border-l border-pink-200/50 dark:border-white/10")}>
                <div className={cn(serif, "text-4xl font-semibold sm:text-5xl", gradientText)}>{s.value}</div>
                <div className="mt-2">
                  <Kicker>{s.label}</Kicker>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- BRANDS ---------- */}
      {data.collaborations.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <SectionLabel index="01" title={t("collabsTitle")} />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.collaborations.map((c) => (
              <div
                key={c.name}
                className={cn(softCard, "flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5")}
              >
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} loading="lazy" className="size-11 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className={cn(serif, "flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 text-base font-semibold text-primary")}>
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className={cn(serif, "truncate text-base leading-tight")}>{c.name}</p>
                  <span className="mt-0.5 block">
                    <Kicker>{t("deals", { count: c.dealCount })}</Kicker>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- SELECTED WORK ---------- */}
      {data.gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionLabel index="02" title={t("workTitle")} />
            {data.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
                  {t("all")}
                </FilterPill>
                {data.platforms.map((p) => (
                  <FilterPill key={p} active={filter === p} onClick={() => setFilter(p)}>
                    {p}
                  </FilterPill>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
            {filteredGallery.map((w) => (
              <figure
                key={w.id}
                className="group relative break-inside-avoid overflow-hidden rounded-2xl shadow-[0_22px_55px_-32px_rgba(236,72,153,0.55)] ring-1 ring-pink-200/40 dark:ring-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.imageUrl}
                  alt={`${w.title}${w.payerName ? ` — ${w.payerName}` : ""}`}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/70 via-black/15 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-sm font-semibold text-white">{w.payerName ?? w.title}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/80">
                    {[w.contentType, w.platforms.join(", ")].filter(Boolean).join(" · ")}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ---------- RATES ---------- */}
      {data.rates.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <SectionLabel index="03" title={tRate("mediaKitRateCard")} />
          <div className={cn(softCard, "mt-8 overflow-hidden rounded-3xl")}>
            {data.rates.map((r, i) => (
              <div
                key={r.id}
                className={cn(
                  "flex items-baseline justify-between gap-4 px-5 py-5 sm:px-7",
                  i > 0 && "border-t border-pink-200/50 dark:border-white/10",
                )}
              >
                <div className="min-w-0">
                  <p className={cn(serif, "text-lg leading-tight")}>{r.contentType}</p>
                  {(r.platform || r.notes) && (
                    <span className="mt-1 block">
                      <Kicker>{[r.platform, r.notes].filter(Boolean).join(" · ")}</Kicker>
                    </span>
                  )}
                </div>
                <p className={cn(serif, "shrink-0 text-xl tabular-nums", gradientText)}>
                  {r.price > 0 ? `${r.price.toLocaleString("en-US")} ${r.currency}` : "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- CONTACT ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="relative overflow-hidden rounded-[2rem] border border-pink-200/60 bg-gradient-to-br from-primary/12 via-white/40 to-violet-400/12 p-10 text-center shadow-xl shadow-primary/10 dark:border-white/10 dark:from-primary/15 dark:via-white/[0.03] dark:to-violet-500/15 sm:p-16">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/20 blur-[90px]" />
          <Sparkles className="mx-auto size-5 text-primary" />
          <Kicker className="mt-3 block">{t("getInTouch")}</Kicker>
          <h2 className={cn(serif, "mx-auto mt-3 max-w-2xl text-[clamp(2rem,6vw,3.5rem)] font-semibold leading-[1.04]")}>
            {t("contactTitle")}
          </h2>
          <p className={cn("mx-auto mt-4 max-w-md text-sm leading-relaxed", muted)}>{t("contactHint")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {(profile.contactEmail || handleAt) && (
              <a
                href={profile.contactEmail ? `mailto:${profile.contactEmail}` : undefined}
                className="rounded-full bg-white/70 px-5 py-2.5 text-sm font-semibold text-primary shadow-sm dark:bg-white/10"
              >
                {profile.contactEmail || handleAt}
              </a>
            )}
            <button type="button" onClick={downloadMediaKit} className={glossyBtn}>
              <Download className="size-4" />
              {tRate("downloadMediaKit")}
            </button>
          </div>
        </div>
      </section>

      <footer className="px-5 pb-10 text-center sm:px-8">
        <Kicker>
          {displayName} · {tRate("generatedNote")}
        </Kicker>
      </footer>
    </div>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn(serif, "text-2xl leading-none", gradientText)}>{index}</span>
      <span className="h-px w-8 bg-gradient-to-r from-primary/60 to-transparent" />
      <span className="text-sm font-semibold uppercase tracking-[0.2em]">{title}</span>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
        active
          ? "border-transparent bg-gradient-to-r from-primary to-violet-500 text-white"
          : "border-pink-200/70 bg-white/60 text-[#9C5C79] hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-[#F6E8EF]/60",
      )}
    >
      {children}
    </button>
  );
}
