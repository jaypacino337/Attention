import type { Metadata } from "next";
import { SendPanel } from "@/components/send-panel";

export const metadata: Metadata = { title: "Send privately · PRVC", description: "Send SOL through throwaway relays and decoys in one transaction you sign." };

export default function SendPage() {
  return (
    <section className="blueprint relative overflow-hidden border-b rule">
      <div className="hero-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-12 md:py-16">
        <p className="label text-[var(--color-orange)]">Send</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Send <span className="serif-italic font-normal text-[var(--color-orange)]">privately</span>.</h1>
        <p className="mt-3 max-w-2xl text-[var(--text-soft)]">Your SOL is split into parts and relayed through throwaway wallets, mixed with decoys that look exactly the same. All of it settles in one transaction you sign once.</p>
        <div className="mt-8"><SendPanel /></div>
      </div>
    </section>
  );
}
