import type { Metadata } from "next";
import { SwapPanel } from "@/components/swap-panel";

export const metadata: Metadata = { title: "Swap to anyone · PRVC", description: "Pay in SOL or stables; the token they want lands in their wallet as your own swap." };

export default function SwapPage() {
  return (
    <section className="blueprint relative overflow-hidden border-b rule">
      <div className="hero-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="text-center">
          <p className="label text-[var(--color-orange)]">Swap</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Pay them in <span className="serif-italic font-normal text-[var(--color-orange)]">their</span> token.</h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--text-soft)]">You pay in SOL or stables. Jupiter finds the best price and the output lands straight in their wallet. On-chain it reads as your own swap, not a transfer to them.</p>
        </div>
        <div className="mt-8"><SwapPanel /></div>
      </div>
    </section>
  );
}
