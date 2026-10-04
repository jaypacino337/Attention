import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CallerBoard } from "@/components/caller-board";
import { ClaimDesk } from "@/components/claim-desk";
import { SectionHead } from "@/components/section-head";
import { Counter } from "@/components/fx/Counter";
import { Reveal } from "@/components/fx/Reveal";
import { SplitText } from "@/components/fx/SplitText";
import { MIN_ELIGIBLE, TOKEN, X_POOL } from "@/lib/config";
import { readCallers } from "@/lib/registry";

export const metadata: Metadata = {
  title: "𝕏 Pool: link your wallet · Attention Markets",
  description: `Post one callout with your wallet's code to join the $ATTENTION 𝕏 pool: 40% of fees, split equally between verified callers.`,
};
export const dynamic = "force-dynamic";

export default async function XPoolPage() {
  const { view, storage } = await readCallers();
  const now = Date.now();
  return (
    <>
      <section className="paper border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="label !text-ink">The 𝕏 pool · 40% of fees</p>
            <SplitText text="CALL IT." className="display mt-4 text-[clamp(3.5rem,11vw,8rem)]" />
            <SplitText text="GET PAID." as="p" delay={0.2} className="display text-[clamp(3.5rem,11vw,8rem)] text-cobalt" />
            <Reveal delay={0.3}>
              <p className="mt-6 max-w-md text-pretty text-lg text-ink-soft">
                Post one callout about ${TOKEN.symbol} with your wallet&apos;s code. Every verified caller holding {MIN_ELIGIBLE.toLocaleString("en-US")}+ gets an
                <strong className="text-ink"> equal share</strong> of the 𝕏 pool, every payout, for {X_POOL.windowDays} days. Post again to renew.
              </p>
              <div className="mt-8 grid grid-cols-2 border-2 border-ink bg-white">
                <div className="border-r-2 border-ink p-4">
                  <p className="label !text-ink">Live callers</p>
                  <p className="condensed mt-2 text-6xl">
                    <Counter value={view.seats.length} />
                  </p>
                </div>
                <div className="p-4">
                  <p className="label !text-ink">Seat lasts</p>
                  <p className="condensed mt-2 text-6xl">{X_POOL.windowDays}d</p>
                </div>
              </div>
              <Link href="/rules#x" className="mt-4 inline-block font-mono text-xs font-extrabold uppercase tracking-[0.14em] underline decoration-2 underline-offset-4 hover:text-cobalt">
                How scoring works →
              </Link>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            {storage === "unconfigured" ? (
              <p className="mb-5 border-2 border-ink bg-white p-4 font-mono text-sm shadow-[4px_4px_0_0_var(--color-cobalt)]">
                Linking opens as soon as the caller registry is connected. Your code below already works.
              </p>
            ) : null}
            <Suspense fallback={<div className="panel h-96" />}>
              <ClaimDesk />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <SectionHead no="𝕏" kicker="Public registry" title={<>Every <span className="serif-italic text-cobalt">seat</span></>}>
            This list is exactly what the payout worker reads (<code className="font-mono text-base">/api/seats</code>). Wallets below{" "}
            {MIN_ELIGIBLE.toLocaleString("en-US")} at payout time are skipped and freed by the next sweep.
          </SectionHead>
          <Reveal className="mt-10">
            <CallerBoard seats={view.seats} windowDays={view.windowDays} now={now} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
