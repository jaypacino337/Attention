import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead } from "@/components/section-head";
import { Reveal } from "@/components/fx/Reveal";
import { SplitText } from "@/components/fx/SplitText";
import { FEE_SPLIT, HOLDER_POOL, MIN_ELIGIBLE, TOKEN, X_POOL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Payout rules · Attention Markets",
  description: "Exactly how $ATTENTION creator fees are split and paid: holder pool, 𝕏 caller pool, buyback and burn.",
};

const fmt = (n: number) => n.toLocaleString("en-US");

function Rule({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[3rem_1fr] gap-4 border-b-2 border-ink/15 py-5 last:border-0">
      <span className="condensed text-4xl text-cobalt">{n}</span>
      <div className="text-pretty text-lg">{children}</div>
    </li>
  );
}

export default function RulesPage() {
  return (
    <>
      <section className="paper border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
          <p className="label !text-ink">The fine print, in large print</p>
          <SplitText text="PAYOUT RULES" className="display mt-4 text-[clamp(3rem,11vw,9rem)]" />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg text-ink-soft">
              Fees in, SOL out. Every number here is a setting in the site&apos;s config and in the payout worker&apos;s config. Nothing is
              decided by hand.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <SectionHead no="A" kicker="The cycle" title="Every cycle" />
          <Reveal className="mt-8">
            <ol className="panel px-5 md:px-8">
              <Rule n="1">The worker claims ${TOKEN.symbol}&apos;s pump.fun creator fees. Under 0.005 SOL, it waits for the next cycle.</Rule>
              <Rule n="2">
                What landed is split with integer math (rounding down, dust stays in the wallet):{" "}
                {FEE_SPLIT.map((b) => `${b.percent}% ${b.name.toLowerCase()}`).join(" · ")}.
              </Rule>
              <Rule n="3">10% market-buys ${TOKEN.symbol} and burns it on-chain.</Rule>
              <Rule n="4">50% is airdropped to the holder pool (below). 40% moves to the 𝕏 pool wallet, which pays out every 6 hours.</Rule>
              <Rule n="5">Every payout is planned, written to a ledger and then sent in batches. A crash resumes without paying anyone twice.</Rule>
            </ol>
          </Reveal>
        </div>
      </section>

      <section id="holders" className="paper border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <SectionHead no="B" kicker="50% of fees" title="Holder pool" />
          <Reveal className="mt-8">
            <ol className="panel px-5 md:px-8">
              <Rule n="1">Eligible: any wallet holding {fmt(MIN_ELIGIBLE)}+ ${TOKEN.symbol} at snapshot time, summed across its token accounts.</Rule>
              <Rule n="2">Excluded: the bonding curve, liquidity pools and every program-owned account, the burn address, and the creator wallet.</Rule>
              <Rule n="3">
                Split pro-rata to balance, capped at {HOLDER_POOL.capBps / 100}% of the pot per wallet. A capped wallet&apos;s excess is re-split
                among everyone else.
              </Rule>
              <Rule n="4">New wallets that would receive less than Solana&apos;s rent minimum are skipped and their share re-split.</Rule>
              <Rule n="5">Cadence: every {HOLDER_POOL.intervalMinutes} minutes, when there are fees to route.</Rule>
            </ol>
          </Reveal>
        </div>
      </section>

      <section id="x" className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <SectionHead no="C" kicker="40% of fees" title="𝕏 caller pool">
            The scoring is deliberately simple, so anyone can audit it: one verified account, one equal share.
          </SectionHead>
          <Reveal className="mt-8">
            <ol className="panel px-5 md:px-8">
              <Rule n="1">
                A seat is earned by a public 𝕏 post containing <code className="bg-paper px-1 font-mono text-base">@{X_POOL.handle} ${TOKEN.symbol} give me a seat · &lt;code&gt;</code>.
                The code is derived from your wallet address, so a post only works for its own wallet.
              </Rule>
              <Rule n="2">Verified through 𝕏&apos;s free public embed endpoint: author, phrase and code. No login and no API key.</Rule>
              <Rule n="3">One 𝕏 account per wallet, one wallet per 𝕏 account, and every post counts once.</Rule>
              <Rule n="4">
                A seat lasts {X_POOL.windowDays} days from the post&apos;s own timestamp. Post a fresh callout from the same account to renew
                it at any time.
              </Rule>
              <Rule n="5">
                Paid only while the wallet holds {fmt(MIN_ELIGIBLE)}+ ${TOKEN.symbol}. A permissionless sweep frees seats whose wallet sold
                below that, reading balances from chain; a failed read never frees a seat.
              </Rule>
              <Rule n="6">The 𝕏 pool wallet&apos;s balance (minus a 0.05 SOL fee reserve) is split equally between live seats every 6 hours.</Rule>
            </ol>
          </Reveal>
          <Reveal className="mt-8">
            <Link href="/x" className="btn btn-cobalt">Get your code →</Link>
          </Reveal>
        </div>
      </section>

      <section className="paper border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <SectionHead no="D" kicker="What we never do" title="Never" />
          <Reveal className="mt-8">
            <ul className="grid gap-4 md:grid-cols-3">
              {[
                "Ask you to connect a wallet or sign a message to get paid.",
                "Ask for a seed phrase or a private key. Ever.",
                "Promise returns. Payouts only exist when there are trading fees.",
              ].map((t) => (
                <li key={t} className="panel lift p-5 text-lg font-bold">
                  <span className="display mb-3 block text-4xl text-cobalt">✕</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
