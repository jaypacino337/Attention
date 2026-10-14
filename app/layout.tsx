import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { WalletProvider } from "@/components/wallet-context";
import { SolanaWalletProvider } from "@/components/solana-wallet";

export const metadata: Metadata = {
  title: "PRVC — private swaps and sends on Solana",
  description:
    "Send SOL through throwaway relays and decoys, or swap straight into someone else's wallet. One transaction, one signature.",
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
          <SolanaWalletProvider>
            <SiteNav />
            <main>{children}</main>
            <SiteFooter />
          </SolanaWalletProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
