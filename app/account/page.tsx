import type { Metadata } from "next";
import { EligibilityPanel } from "@/components/eligibility-panel";
import { XLinkForm } from "@/components/x-link-form";
import { FEE_SPLIT, MIN_ELIGIBLE } from "@/lib/config";

export const metadata: Metadata = { title: "Account — Attention Markets" };

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <p className="label">Account</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
        Your <span className="serif-italic font-normal">attention</span>.
      </h1>
      <p className="mt-4 max-w-xl text-sm text-[var(--text-soft)]">
        Verify your wallet, check which pools you qualify for, and bind the X account your posts
        earn from.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <EligibilityPanel eligibleAt={MIN_ELIGIBLE} />
        <XLinkForm />
      </div>

      <div className="mt-12">
        <p className="label">Pools you can earn from</p>
        <div className="mt-4 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {FEE_SPLIT.map((bucket) => (
            <div key={bucket.id} className="bg-[var(--ground)] p-5">
              <p className="font-mono text-2xl font-bold">{bucket.percent}%</p>
              <p className="mt-1 font-bold">{bucket.name}</p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">{bucket.tagline}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
