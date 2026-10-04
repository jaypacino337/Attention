import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { SITE_URL } from "@/lib/config";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--font-instrument", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700", "800"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Attention Markets ($ATTENTION): attention pays",
  description:
    "$ATTENTION pays its holders and its 𝕏 callers automatically from creator fees. Hold 250K, or post your callout. Nothing to claim, nothing to sign.",
  openGraph: {
    title: "Attention Markets: attention pays",
    description: "50% to holders. 40% to 𝕏 callers. 10% buyback & burn. Paid automatically, nothing to claim.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#f1ede3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased">
        <ScrollProgress />
        <SmoothScroll />
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
