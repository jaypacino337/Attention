import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { WalletProvider } from "@/components/wallet-context";

export const metadata: Metadata = {
  title: "Attention Markets — Attention is currency",
  description:
    "The attention layer of Solana. Find attention. Create attention. Get rewarded for it.",
  openGraph: {
    title: "Attention Markets",
    description: "Attention is currency. The attention layer of Solana.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <WalletProvider>
          <SiteNav />
          <main>{children}</main>
          <SiteFooter />
        </WalletProvider>
      </body>
    </html>
  );
}
