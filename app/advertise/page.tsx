import type { Metadata } from "next";
import { AdSlot } from "@/components/ad-slot";

export const metadata: Metadata = {
  title: "Advertise — Attention Markets",
  description: "Paid placements in front of an audience built on attention.",
};

/**
 * Ad inventory lives here, off the homepage — Attention Markets is an
 * attention protocol, not an ad network. Same working AdSlot/ADS_JSON
 * mechanics as before, just relocated.
 */
export default function AdvertisePage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <p className="label">Inventory</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
        Buy <span className="serif-italic font-normal">attention</span> on the site.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-soft)]">
        Projects can pay for placement in front of an audience that is already here for attention.
        Slots below are live inventory — unsold slots show as available. In the future, projects
        will be able to pay to get attention across the protocol itself.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <AdSlot slot="banner" label="Home banner" size="1280 × 200" />
        <AdSlot slot="terminal" label="Terminal sidebar" size="400 × 300" />
      </div>
    </section>
  );
}
