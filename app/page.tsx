import Link from "next/link";
import { MarkHero } from "@/components/mark";
import { ConnectButton } from "@/components/connect-button";
import { EligibilityPanel } from "@/components/eligibility-panel";
import { AdSlot } from "@/components/ad-slot";
import { TokenStats } from "@/components/token-stats";
import { FEE_SPLIT, FULL_TIER, LINKS, MIN_ELIGIBLE, TIERS, TOKEN } from "@/lib/config";

const fmt = (n: number) => n.toLocaleString("en-US");

const accentClass: Record<string, string> = {
  orange: "bg-[var(--color-orange)]",
  lime: "bg-[var(--color-lime)]",
  ink: "bg-[var(--text)]",
};

export default function HomePage() {
  return (
    <>
      <TokenStats />

      {/* Hero */}
      <section className="blueprint border-b rule">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="label">The attention layer of Solana</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">
              Attention
              <br />
              <span className="serif-italic font-normal">Markets</span>
            </h1>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-px w-16 bg-[var(--text)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-orange)]" />
            </div>
            <p className="mt-6 max-w-md text-xl font-bold">
              Attention is <span className="serif-italic font-normal text-[var(--color-orange)]">currency</span>.
            </p>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--text-soft)]">
              Every fee this token collects goes back to the people who find attention, hold it,
              and call it out — plus a house wallet that trades, wins, and burns.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ConnectButton />
              <Link
                href="#tokenomics"
                className="border px-4 py-2 text-sm font-semibold rule hover:border-[var(--color-orange)]"
              >
                See the split
              </Link>
              {LINKS.pumpfun ? (
                <a
                  href={LINKS.pumpfun}
                  className="text-sm font-semibold text-[var(--text-soft)] underline decoration-[var(--color-orange)] underline-offset-4 hover:text-[var(--color-orange)]"
                >
                  Buy on pump.fun
                </a>
              ) : null}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md text-[var(--text)]">
            <MarkHero />
          </div>
        </div>
      </section>

      {/* Fee split */}
      <section id="tokenomics" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label">Where the fees go</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                90% out. <span className="serif-italic font-normal">10% hunting.</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm text-[var(--text-soft)]">
              Fees are split every epoch. Three pools pay holders directly; the fourth funds the
              wallet that plays the market and burns what it makes.
            </p>
          </div>

          {/* Proportional bar — the split shown at true scale, not as equal cards. */}
          <div className="mt-10 flex h-3 w-full overflow-hidden">
            {FEE_SPLIT.map((bucket) => (
              <div
                key={bucket.id}
                className={accentClass[bucket.accent]}
                style={{ width: `${bucket.percent}%` }}
                title={`${bucket.name} — ${bucket.percent}%`}
              />
            ))}
          </div>

          <div className="mt-8 grid gap-px bg-[var(--line)] md:grid-cols-2 lg:grid-cols-4">
            {FEE_SPLIT.map((bucket) => (
              <article key={bucket.id} className="bg-[var(--ground)] p-6">
                <span className={`block h-1 w-8 ${accentClass[bucket.accent]}`} />
                <div className="mt-4">
                  <span className="font-mono text-4xl font-bold tracking-tight">
                    {bucket.percent}
                    <span className="align-super text-lg">%</span>
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{bucket.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[var(--color-orange)]">
                  {bucket.tagline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">
                  {bucket.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards + eligibility */}
      <section id="rewards" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className="label">Who gets paid</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Hold the floor, <span className="serif-italic font-normal">earn the pools</span>.
          </h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
                {TIERS.filter((tier) => tier.min > 0).map((tier) => (
                  <div key={tier.id} className="bg-[var(--ground)] p-6">
                    <p className="label">{tier.name}</p>
                    <p className="mt-2 font-mono text-3xl font-bold tracking-tight">
                      {fmt(tier.min)}
                    </p>
                    <p className="text-sm text-[var(--text-soft)]">
                      {TOKEN.symbol} minimum · {tier.weight}x weight
                    </p>
                    <ul className="mt-4 space-y-2">
                      {tier.perks.map((perk) => (
                        <li key={perk} className="flex gap-2 text-sm text-[var(--text-soft)]">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-orange)]" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-l-2 border-[var(--color-orange)] pl-4">
                <p className="text-sm leading-relaxed text-[var(--text-soft)]">
                  <strong className="text-[var(--text)]">X rewards need a linked wallet.</strong>{" "}
                  Post, get attention, and the social pool pays the wallet bound to that X account.
                  Link it once from your account page — unlinked or unverified accounts don&apos;t
                  earn.
                </p>
              </div>
            </div>

            <EligibilityPanel eligibleAt={MIN_ELIGIBLE} fullAt={FULL_TIER} />
          </div>
        </div>
      </section>

      {/* Buy & burn loop */}
      <section className="border-b rule bg-[var(--ground-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="label">The 10%</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight">
                The house <span className="serif-italic font-normal">plays too</span>.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-soft)]">
                A tenth of fees funds the Attention wallet and scanner. It hunts attention on
                chain, takes positions, and makes its own callouts — earning callout rewards like
                anyone else. Profit and rewards come back as buy-and-burn.
              </p>
            </div>

            <ol className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
              {[
                { step: "01", title: "Fund", body: "10% of fees capitalise the Attention wallet." },
                { step: "02", title: "Scan", body: "The scanner tracks where attention is moving, chain by chain." },
                { step: "03", title: "Trade & call", body: "It takes positions and posts callouts, earning from the callout pool." },
                { step: "04", title: "Buy & burn", body: "Profit plus callout rewards buy ATTENTION and burn it." },
              ].map((item) => (
                <li key={item.step} className="bg-[var(--ground-raised)] p-6">
                  <span className="label">{item.step}</span>
                  <h3 className="mt-2 font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Terminal teaser */}
      <section className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label">Token-gated</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                Attention <span className="serif-italic font-normal">Terminal</span>
              </h2>
            </div>
            <Link
              href="/terminal"
              className="bg-[var(--color-orange)] px-4 py-2 text-sm font-bold text-white"
            >
              Open terminal
            </Link>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-soft)]">
            An intelligence desk for attention: top wallets, the callers who actually land, which
            meta is rotating, and which chain the flow is on. Open to holders from{" "}
            {fmt(MIN_ELIGIBLE)} {TOKEN.symbol}.
          </p>

          <div className="mt-8 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Top wallets", body: "Who is up, what they hold, how often they're right." },
              { title: "Top callers", body: "Landed calls and average multiple, ranked by result." },
              { title: "The meta", body: "Which narrative owns attention right now, and its 24h move." },
              { title: "Chain flow", body: "Where attention sits — Solana, Base, BNB, Ethereum." },
            ].map((panel) => (
              <div key={panel.title} className="bg-[var(--ground)] p-6">
                <h3 className="font-bold">{panel.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-soft)]">{panel.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad space */}
      <section id="adspace" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label">Inventory</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight">
                Buy <span className="serif-italic font-normal">attention</span> on the site.
              </h2>
            </div>
            <p className="max-w-sm text-sm text-[var(--text-soft)]">
              Projects can pay for placement in front of an audience that is already here for
              attention. Slots below are live inventory — unsold slots show as available.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <AdSlot slot="banner" label="Home banner" size="1280 × 200" />
            <AdSlot slot="terminal" label="Terminal sidebar" size="400 × 300" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="blueprint">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Get in, get <span className="serif-italic font-normal">seen</span>, get paid.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--text-soft)]">
            Hold {fmt(MIN_ELIGIBLE)} {TOKEN.symbol} to qualify. Hold {fmt(FULL_TIER)} to earn at
            double weight and unlock the full terminal.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ConnectButton />
            <Link
              href="/account"
              className="border px-4 py-2 text-sm font-semibold rule hover:border-[var(--color-orange)]"
            >
              Link your X
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
