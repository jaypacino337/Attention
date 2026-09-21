import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { WalletProvider } from "@/components/wallet-context";

export const metadata: Metadata = {
  title: "PRVC — Privacy on Solana",
  description:
    "PRVC is a privacy-first community token on Solana. Privacy is a right, not a feature.",
  openGraph: {
    title: "PRVC",
    description: "Privacy on Solana. Privacy is a right, not a feature.",
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
