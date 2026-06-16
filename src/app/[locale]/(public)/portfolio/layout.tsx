import { Playfair_Display } from "next/font/google";

// Editorial serif for Latin/English text & big numerals. Playfair has no Thai
// glyphs, so Thai falls through the font stack to Athiti (the app default).
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
 *
 * Base font stack: Playfair Display for English (Latin), with Athiti as the
 * fallback so Thai characters stay readable.
 */
export default function PublicPortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${playfair.variable} min-h-dvh antialiased`}
      style={{ fontFamily: "var(--font-playfair), var(--font-athiti)" }}
    >
      {children}
    </div>
  );
}
