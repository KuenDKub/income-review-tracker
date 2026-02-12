import type { Metadata } from "next";
import { Athiti } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const athiti = Athiti({
  variable: "--font-athiti",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Review Income & Tax Tracker",
  description: "Review Income & Tax Tracker (Thailand-focused)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${athiti.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
