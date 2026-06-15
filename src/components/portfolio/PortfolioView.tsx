"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronRight, Copy, Download, Heart, Sparkles, X } from "lucide-react";
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
  avatarUrl: string | null;
  coverUrl: string | null;
  contactTitle: string;
  contactHint: string;
};

const serif = "font-[family-name:var(--font-playfair)]";
// Soft, warm rose → pink → lilac — a feminine signature gradient.
const gradientText =
  "bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent";
const gradientBg = "bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400";
// Warm blush canvas tones (no hard black anywhere — keep it airy & soft).
const blushBg = "bg-[#FFF5F8]";
const creamBg = "bg-[#FFFBF8]";
const lilacBg = "bg-[#FBF1F7]";
const muted = "text-[#B07B92]";

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
  // Drives the hero entrance animation once the component mounts.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [activeBrand, setActiveBrand] = useState<PortfolioViewData["collaborations"][number] | null>(null);

  const handleAt = profile.handle ? `@${profile.handle.replace(/^@/, "")}` : "";
  const displayName = profile.creatorName.trim() || profile.handle.trim() || t("creatorFallback");

  const filteredGallery = useMemo(
    () => (filter === "all" ? data.gallery : data.gallery.filter((w) => w.platforms.includes(filter))),
    [data.gallery, filter],
  );
  // Hero slideshow: auto-rotating crossfade through the first few works.
  const heroSlides = useMemo(() => data.gallery.slice(0, 6), [data.gallery]);
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(id);
  }, [heroSlides.length]);
  // Keep the index in range if the gallery shrinks.
  useEffect(() => {
    setHeroIndex((i) => (i >= heroSlides.length ? 0 : i));
  }, [heroSlides.length]);
  const heroImage = heroSlides[heroIndex] ?? null;

  // Images for the currently-open brand (matched by payer name).
  const brandWorks = useMemo(
    () => (activeBrand ? data.gallery.filter((w) => w.payerName === activeBrand.name) : []),
    [activeBrand, data.gallery],
  );

  // Close the brand modal on Escape and lock background scroll while open.
  useEffect(() => {
    if (!activeBrand) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveBrand(null);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeBrand]);

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
    <div className="text-[#5A3247]">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className={cn(blushBg, "relative overflow-hidden")}>
        {profile.coverUrl ? (
          <>
            {/* Cover photo as the hero backdrop */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.coverUrl}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 size-full object-cover"
            />
            {/* Blush veil — stronger on the left for text legibility */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FFF5F8]/92 via-[#FFF5F8]/70 to-[#FFF5F8]/40"
            />
            {/* Fade into the canvas at the bottom so sections blend */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#FFF5F8]"
            />
          </>
        ) : (
          <>
            {/* Soft pastel orbs (no cover photo set) */}
            <div aria-hidden className="pointer-events-none absolute -top-28 left-1/4 size-[34rem] rounded-full bg-rose-300/30 blur-[140px]" />
            <div aria-hidden className="pointer-events-none absolute bottom-0 right-1/4 size-[30rem] rounded-full bg-fuchsia-200/40 blur-[140px]" />
            <div aria-hidden className="pointer-events-none absolute top-1/3 -left-20 size-[22rem] rounded-full bg-amber-100/40 blur-[120px]" />
          </>
        )}

        {/* Nav */}
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <span className={cn("text-[11px] font-semibold uppercase tracking-[0.28em]", muted)}>
            {handleAt || displayName}
          </span>
          <span className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]", muted)}>
            <Heart className="size-3 fill-rose-300 text-rose-300" aria-hidden />
            {t("portfolioLabel")}
          </span>
        </header>

        {/* Hero body */}
        <div className="relative mx-auto max-w-6xl px-6 pb-0 pt-8 sm:px-10 sm:pt-12">
          <div className="grid gap-12 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:pb-28">
            {/* Left: text */}
            <div
              className={cn(
                "motion-safe:transition-all motion-safe:duration-[900ms] motion-safe:ease-out",
                mounted ? "opacity-100 translate-y-0" : "motion-safe:opacity-0 motion-safe:translate-y-6",
              )}
            >
              {/* Avatar */}
              {profile.avatarUrl && (
                <div className="mb-6 inline-block">
                  <div aria-hidden className="absolute -z-10 size-24 rounded-full bg-gradient-to-br from-rose-300/50 to-fuchsia-200/50 blur-xl sm:size-28" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="size-24 rounded-full object-cover shadow-lg shadow-rose-300/40 ring-4 ring-white sm:size-28"
                  />
                </div>
              )}

              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-white/70 px-4 py-1.5 text-[11px] font-semibold text-rose-500 shadow-sm shadow-rose-200/40 backdrop-blur-sm">
                <Sparkles className="size-3 text-rose-400" aria-hidden />
                {t("portfolioLabel")}
                {data.stats.firstDealYear ? ` · ${tRate("since")} ${data.stats.firstDealYear}` : ""}
              </div>

              {/* Display name */}
              <h1
                className={cn(
                  serif,
                  "text-[clamp(3.5rem,11vw,7.5rem)] font-semibold leading-[0.9] tracking-tight",
                  gradientText,
                )}
              >
                {displayName}
              </h1>

              {handleAt && (
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.26em] text-rose-400/80">
                  {handleAt}
                </p>
              )}

              {profile.tagline && (
                <p className={cn(serif, "mt-5 max-w-md text-lg italic leading-relaxed text-[#8A5A72]")}>
                  &ldquo;{profile.tagline}&rdquo;
                </p>
              )}

              {/* Platform tags */}
              {data.stats.platforms.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-2">
                  {data.stats.platforms.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-rose-200/70 bg-white/70 px-4 py-1.5 text-xs font-medium text-[#8A5A72] shadow-sm shadow-rose-100/50"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadMediaKit}
                  className={cn(
                    gradientBg,
                    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-300/50 transition-all hover:opacity-90 active:scale-[0.98]",
                  )}
                >
                  <Download className="size-4" />
                  {tRate("downloadMediaKit")}
                </button>
                <button
                  type="button"
                  onClick={copyContact}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-rose-200/80 bg-white/70 px-7 py-3 text-sm font-semibold text-[#8A5A72] shadow-sm transition-colors hover:bg-white"
                >
                  {copied ? <Check className="size-4 text-rose-400" /> : <Copy className="size-4" />}
                  {copied ? t("contactCopied") : t("copyContact")}
                </button>
              </div>
            </div>

            {/* Right: hero image + floating stat badges (desktop) */}
            <div
              className={cn(
                "hidden lg:block",
                "motion-safe:transition-all motion-safe:delay-200 motion-safe:duration-[900ms] motion-safe:ease-out",
                mounted ? "opacity-100 translate-y-0" : "motion-safe:opacity-0 motion-safe:translate-y-8",
              )}
            >
              {heroImage ? (
                <div className="relative">
                  <div aria-hidden className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-rose-300/40 to-fuchsia-200/40 blur-2xl" />
                  {/* Auto-rotating crossfade slideshow */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-rose-300/40 ring-1 ring-white/70">
                    {heroSlides.map((slide, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={slide.id}
                        src={slide.imageUrl}
                        alt={displayName}
                        aria-hidden={i !== heroIndex}
                        className={cn(
                          "absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-in-out",
                          i === heroIndex ? "opacity-100" : "opacity-0",
                        )}
                      />
                    ))}
                    {/* Slide indicators */}
                    {heroSlides.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {heroSlides.map((slide, i) => (
                          <button
                            key={slide.id}
                            type="button"
                            onClick={() => setHeroIndex(i)}
                            aria-label={t("goToSlide", { index: i + 1 })}
                            aria-current={i === heroIndex}
                            className={cn(
                              "h-1.5 rounded-full shadow-sm transition-all duration-300",
                              i === heroIndex ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90",
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Floating badge — fades as the slide changes */}
                  <div className="absolute -bottom-5 -left-6 flex items-center gap-2 rounded-2xl border border-rose-100 bg-white/90 px-4 py-2.5 shadow-lg shadow-rose-200/50 backdrop-blur-sm">
                    <Sparkles className="size-4 text-rose-400" aria-hidden />
                    <span
                      key={heroImage.id}
                      className="text-xs font-semibold text-[#8A5A72] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-700"
                    >
                      {heroImage.payerName ?? heroImage.contentType}
                    </span>
                  </div>
                </div>
              ) : (
                /* No hero image → stacked stat cards */
                <div className="space-y-4">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-6 rounded-3xl border border-rose-100 bg-white/70 p-6 shadow-sm shadow-rose-100/50 backdrop-blur-sm"
                    >
                      <div className={cn(serif, "text-5xl font-bold tabular-nums", gradientText)}>
                        {s.value}
                      </div>
                      <p className={cn("text-sm font-semibold uppercase tracking-[0.18em]", muted)}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative mx-auto max-w-6xl px-6 pb-12 sm:px-10">
          <div className="grid grid-cols-3 divide-x divide-rose-100 rounded-[1.75rem] border border-rose-100 bg-white/70 shadow-sm shadow-rose-100/50 backdrop-blur-sm">
            {stats.map((s) => (
              <div key={s.label} className="px-4 py-7 text-center sm:px-6">
                <div className={cn(serif, "text-3xl font-bold tabular-nums sm:text-4xl", gradientText)}>
                  {s.value}
                </div>
                <p className={cn("mt-2 text-[10px] font-semibold uppercase tracking-[0.22em]", muted)}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRANDS ───────────────────────────────────────────── */}
      {data.collaborations.length > 0 && (
        <section className={cn(creamBg, "px-6 py-16 sm:px-10 sm:py-24")}>
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <SectionLabel index="01" title={t("collabsTitle")} />
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {data.collaborations.map((c, i) => (
                <Reveal key={c.name} delay={Math.min(i, 8) * 60}>
                <button
                  type="button"
                  onClick={() => setActiveBrand(c)}
                  aria-label={t("viewBrand", { name: c.name })}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4 text-left shadow-sm shadow-rose-100/40 transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md hover:shadow-rose-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      loading="lazy"
                      className="size-11 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span
                      className={cn(
                        serif,
                        "flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-fuchsia-100 text-base font-bold text-rose-500",
                      )}
                    >
                      {c.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#5A3247]">{c.name}</p>
                    <p className="text-[11px] font-medium text-rose-300">
                      {t("deals", { count: c.dealCount })}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-rose-200 transition-colors group-hover:text-rose-400" aria-hidden />
                </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY ──────────────────────────────────────────── */}
      {data.gallery.length > 0 && (
        <section className={cn(lilacBg, "px-6 py-16 sm:px-10 sm:py-24")}>
          <div className="mx-auto max-w-6xl">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
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
            </Reveal>

            <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
              {filteredGallery.map((w, i) => (
                <Reveal key={w.id} delay={Math.min(i, 8) * 50} className="break-inside-avoid">
                <figure
                  className="group relative break-inside-avoid overflow-hidden rounded-3xl shadow-sm shadow-rose-200/40 ring-1 ring-rose-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={w.imageUrl}
                    alt={`${w.title}${w.payerName ? ` — ${w.payerName}` : ""}`}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-rose-900/70 via-rose-900/15 to-transparent p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-sm font-semibold text-white">{w.payerName ?? w.title}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.15em] text-white/75">
                      {[w.contentType, w.platforms.join(", ")].filter(Boolean).join(" · ")}
                    </p>
                  </figcaption>
                </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── RATES ────────────────────────────────────────────── */}
      {data.rates.length > 0 && (
        <section className={cn(creamBg, "px-6 py-16 sm:px-10 sm:py-24")}>
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <SectionLabel index="03" title={tRate("mediaKitRateCard")} />
            </Reveal>
            <Reveal delay={80} className="mt-10 overflow-hidden rounded-[1.75rem] border border-rose-100 bg-white shadow-sm shadow-rose-100/50">
              {data.rates.map((r, i) => (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-rose-50/60 sm:px-8",
                    i > 0 && "border-t border-rose-50",
                  )}
                >
                  <div className="min-w-0">
                    <p className={cn(serif, "text-base font-semibold leading-tight text-[#5A3247]")}>
                      {r.contentType}
                    </p>
                    {(r.platform || r.notes) && (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300">
                        {[r.platform, r.notes].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <p className={cn(serif, "shrink-0 text-xl font-bold tabular-nums", gradientText)}>
                    {r.price > 0 ? `${r.price.toLocaleString("en-US")} ${r.currency}` : "—"}
                  </p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* ── CONTACT CTA ──────────────────────────────────────── */}
      <section className={cn(blushBg, "relative overflow-hidden px-6 py-24 sm:px-10 sm:py-36")}>
        <div aria-hidden className="pointer-events-none absolute -top-20 left-1/3 size-[28rem] rounded-full bg-rose-200/50 blur-[130px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 right-1/3 size-[24rem] rounded-full bg-fuchsia-200/50 blur-[130px]" />
        <Reveal className="relative mx-auto max-w-2xl text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/80 shadow-sm shadow-rose-200/50">
            <Heart className="size-5 fill-rose-300 text-rose-400" aria-hidden />
          </span>
          <p className={cn("mt-5 text-[11px] font-semibold uppercase tracking-[0.3em]", muted)}>
            {t("getInTouch")}
          </p>
          <h2
            className={cn(
              serif,
              "mx-auto mt-4 text-[clamp(2.25rem,7vw,4.5rem)] font-semibold leading-[1.05]",
              gradientText,
            )}
          >
            {profile.contactTitle?.trim() || t("contactTitle")}
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-[#8A5A72]">
            {profile.contactHint?.trim() || t("contactHint")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {(profile.contactEmail || handleAt) && (
              <a
                href={profile.contactEmail ? `mailto:${profile.contactEmail}` : undefined}
                className="rounded-full border border-rose-200/80 bg-white/80 px-6 py-3 text-sm font-semibold text-[#8A5A72] shadow-sm transition-colors hover:bg-white"
              >
                {profile.contactEmail || handleAt}
              </a>
            )}
            <button
              type="button"
              onClick={downloadMediaKit}
              className={cn(
                gradientBg,
                "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-300/50 transition-all hover:opacity-90 active:scale-[0.98]",
              )}
            >
              <Download className="size-4" />
              {tRate("downloadMediaKit")}
            </button>
          </div>
        </Reveal>
      </section>

      <footer className={cn(blushBg, "border-t border-rose-100 px-6 pb-10 pt-8 text-center sm:px-10")}>
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.24em]", muted, "opacity-70")}>
          {displayName} · {tRate("generatedNote")}
        </p>
      </footer>

      {/* ── BRAND DETAIL MODAL ───────────────────────────────── */}
      {activeBrand && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeBrand.name}
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
        >
          {/* Backdrop */}
          <div
            aria-hidden
            onClick={() => setActiveBrand(null)}
            className="absolute inset-0 bg-rose-950/30 backdrop-blur-sm"
          />

          {/* Panel */}
          <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-rose-100 bg-white shadow-2xl shadow-rose-400/30 sm:rounded-3xl">
            <button
              type="button"
              onClick={() => setActiveBrand(null)}
              aria-label={t("close")}
              className="absolute right-4 top-4 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/80 text-[#8A5A72] shadow-sm backdrop-blur-sm transition-colors hover:bg-rose-50"
            >
              <X className="size-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 border-b border-rose-50 bg-gradient-to-br from-rose-50/70 to-fuchsia-50/50 p-6 pr-16">
              {activeBrand.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeBrand.imageUrl}
                  alt={activeBrand.name}
                  className="size-14 shrink-0 rounded-2xl object-cover shadow-sm"
                />
              ) : (
                <span
                  className={cn(
                    serif,
                    "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-fuchsia-100 text-2xl font-bold text-rose-500",
                  )}
                >
                  {activeBrand.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <h3 className={cn(serif, "truncate text-xl font-bold text-[#5A3247]")}>
                  {activeBrand.name}
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-400">
                  {t("deals", { count: activeBrand.dealCount })}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-6 p-6">
              {activeBrand.platforms.length > 0 && (
                <div>
                  <ModalLabel>{t("brandPlatforms")}</ModalLabel>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeBrand.platforms.map((p) => (
                      <span
                        key={p}
                        className="rounded-full border border-rose-200/70 bg-rose-50/60 px-3 py-1 text-xs font-medium text-[#8A5A72]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeBrand.contentTypes.length > 0 && (
                <div>
                  <ModalLabel>{t("brandContentTypes")}</ModalLabel>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeBrand.contentTypes.map((ct) => (
                      <span
                        key={ct}
                        className="rounded-full border border-fuchsia-200/70 bg-fuchsia-50/50 px-3 py-1 text-xs font-medium text-[#8A5A72]"
                      >
                        {ct}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <ModalLabel>{t("brandWork")}</ModalLabel>
                {brandWorks.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {brandWorks.map((w) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={w.id}
                        src={w.imageUrl}
                        alt={w.title}
                        loading="lazy"
                        className="aspect-square w-full rounded-xl object-cover ring-1 ring-rose-100"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-rose-300">{t("brandNoWork")}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reveals its children with a fade + slide-up the first time they scroll into
 * view. No-ops (renders fully visible) when the user prefers reduced motion.
 */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out",
        shown ? "opacity-100 translate-y-0" : "motion-safe:translate-y-8 motion-safe:opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ModalLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B07B92]">
      {children}
    </span>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "font-[family-name:var(--font-playfair)] text-2xl font-bold leading-none",
          "bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent",
        )}
      >
        {index}
      </span>
      <span className="h-px w-8 bg-gradient-to-r from-rose-300 to-transparent" />
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B07B92]">
        {title}
      </span>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all",
        active
          ? "border-transparent bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 text-white shadow-md shadow-rose-300/40"
          : "border-rose-200/80 bg-white/70 text-[#B07B92] hover:bg-white hover:text-rose-500",
      )}
    >
      {children}
    </button>
  );
}
