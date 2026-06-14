import { Playfair_Display } from "next/font/google";

// Editorial serif for display headings & big numerals (Latin). Thai content
// falls back to Athiti (the app default), which keeps Thai readable.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

/**
 * Minimal public canvas for the shareable portfolio — no app chrome. Warm
 * editorial "cream paper" background; the page manages its own widths so
 * sections can run wide / full-bleed like a magazine.
 */
export default function PublicPortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${playfair.variable} min-h-dvh bg-[#FFF7FB] text-[#4A1B34] antialiased dark:bg-[#160C12] dark:text-[#F6E8EF]`}
    >
      {children}
    </div>
  );
}
