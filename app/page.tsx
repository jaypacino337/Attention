import Link from "next/link";
import { MarkHero } from "@/components/mark";
import { ConnectButton } from "@/components/connect-button";
import { EligibilityPanel } from "@/components/eligibility-panel";
import { TokenStats } from "@/components/token-stats";
import { LiveAttentionModule } from "@/components/live-attention";
import { Flywheel } from "@/components/flywheel";
import { ScannerTable } from "@/components/scanner-table";
import { FEE_SPLIT, LINKS, MIN_ELIGIBLE, TIERS } from "@/lib/config";
import { fundHasData, loadFund } from "@/lib/fund";
import { loadLiveAttention } from "@/lib/live";
import { loadScannerCalls } from "@/lib/scanner";

/** Live data on the page — never serve a stale prerender of "right now". */
export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-US");

const accentClass: Record<string, string> = {
  orange: "bg-[var(--color-orange)]",
  lime: "bg-[var(--color-lime)]",
  ink: "bg-[var(--text)]",
};

export default async function HomePage() {
  const [live, scannerCalls, fund] = await Promise.all([
    loadLiveAttention(),
    loadScannerCalls(),
    loadFund(),
  ]);

  return (
    <>
      <TokenStats />

      {/* 1 — HERO */}
      <section className="blueprint border-b rule">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
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
            <p className="mt-6 max-w-md text-lg font-bold leading-snug">
              Find attention. Create attention. Get rewarded for it.
            </p>
            <p className="mt-2 max-w-md text-xl font-bold">
              Attention is{" "}
              <span className="serif-italic font-normal text-[var(--color-orange)]">currency</span>.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/terminal"
                className="bg-[var(--color-orange)] px-4 py-2.5 text-sm font-bold text-white"
              >
                Open Terminal
              </Link>
              <Link
                href="/scanner"
                className="border px-4 py-2.5 text-sm font-semibold rule hover:border-[var(--color-orange)]"
              >
                Attention Scanner
              </Link>
              <ConnectButton />
            </div>
          </div>

          <div className="mx-auto w-full max-w-xs text-[var(--text)] md:max-w-md">
            <MarkHero />
          </div>
        </div>
      </section>

      {/* 2 — LIVE ATTENTION */}
      <section className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label">Right now</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
                Live <span className="serif-italic font-normal">attention</span>
              </h2>
            </div>
            <p className="max-w-xs text-sm text-[var(--text-soft)]">
              What is capturing attention across pump.fun, FOMO and X.
            </p>
          </div>
          <LiveAttentionModule data={live} />
        </div>
      </section>

      {/* 3 — HOW ATTENTION PAYS */}
      <section id="how" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="label">How attention pays</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-6xl">
            90% out. <span className="serif-italic font-normal">10% hunting.</span>
          </h2>

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

          <div className="mt-8 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {FEE_SPLIT.map((bucket) => (
              <article key={bucket.id} className="bg-[var(--ground)] p-6">
                <span className={`block h-1 w-8 ${accentClass[bucket.accent]}`} />
                <p className="mt-4 font-mono text-4xl font-bold tracking-tight">
                  {bucket.percent}
                  <span className="align-super text-lg">%</span>
                </p>
                <h3 className="mt-3 font-mono text-sm font-bold uppercase tracking-widest">
                  {bucket.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-[var(--color-orange)]">
                  {bucket.tagline}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-14 grid items-start gap-10 md:grid-cols-2">
            <div>
              <p className="label">The flywheel</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-soft)]">
                Creator fees reward the people generating attention. A tenth capitalizes the fund
                that hunts where attention goes next — and what it makes comes back as buyback and
                burn.
              </p>
            </div>
            <Flywheel />
          </div>
        </div>
      </section>

      {/* 4 — SCANNER PREVIEW */}
      <section className="border-b rule bg-[var(--ground-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label">Intelligence layer</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                Attention <span className="serif-italic font-normal">Scanner</span>
              </h2>
              <p className="mt-3 text-lg font-bold text-[var(--color-orange)]">
                Where is attention going next?
              </p>
            </div>
            <Link
              href="/scanner"
              className="bg-[var(--color-orange)] px-4 py-2.5 text-sm font-bold text-white"
            >
              Open Scanner →
            </Link>
          </div>

          <div className="mt-8">
            <ScannerTable calls={scannerCalls.slice(0, 3)} numbered />
          </div>
        </div>
      </section>

      {/* 5 — EARN ATTENTION */}
      <section id="rewards" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="label">Earn attention</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Three ways <span className="serif-italic font-normal">in</span>.
          </h2>

          <div className="mt-10 grid gap-px bg-[var(--line)] md:grid-cols-3">
            {[
              {
                k: "01",
                title: "Call it",
                body: "Find attention early on pump.fun. Landed callouts earn from the callout pool.",
                href: LINKS.pumpfun || "/scanner",
                cta: "See the record",
              },
              {
                k: "02",
                title: "Find it",
                body: "Surface opportunities through FOMO before they're consensus.",
                href: "/scanner",
                cta: "Open scanner",
              },
              {
                k: "03",
                title: "Create it",
                body: "Generate and maintain attention on X. Rewards route to the wallet behind the attention.",
                href: LINKS.x,
                cta: "Post on X",
              },
            ].map((item) => (
              <Link
                key={item.k}
                href={item.href}
                className="group bg-[var(--ground)] p-6 hover:bg-[var(--ground-raised)]"
              >
                <span className="label">{item.k}</span>
                <h3 className="mt-2 text-xl font-extrabold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{item.body}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-[var(--color-orange)] group-hover:underline group-hover:underline-offset-4">
                  {item.cta} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — ATTENTION FUND */}
      <section className="border-b rule bg-[var(--ground-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label">The 10%</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                Attention <span className="serif-italic font-normal">Fund</span>
              </h2>
              <p className="mt-3 text-lg font-bold">Trading where attention goes next.</p>
            </div>
            <Link
              href="/fund"
              className="border px-4 py-2.5 text-sm font-semibold rule hover:border-[var(--color-orange)]"
            >
              Fund dashboard →
            </Link>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-soft)]">
            A portion of creator fees capitalizes the Attention Fund. Trading profits and callout
            rewards are used to buy back and burn $ATTENTION.
          </p>

          {fundHasData(fund) ? (
            <div className="mt-8 grid gap-px bg-[var(--line)] sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Fund value", value: fund.stats.fundValueSol, unit: "SOL" },
                { label: "Realized PnL", value: fund.stats.realizedPnlSol, unit: "SOL" },
                { label: "Callout rewards", value: fund.stats.calloutRewardsSol, unit: "SOL" },
                { label: "Bought back", value: fund.stats.attentionBoughtBack, unit: "ATTN" },
                { label: "Burned", value: fund.stats.attentionBurned, unit: "ATTN" },
              ]
                .filter((stat) => typeof stat.value === "number")
                .map((stat) => (
                  <div key={stat.label} className="bg-[var(--ground-raised)] p-5">
                    <p className="label">{stat.label}</p>
                    <p className="mt-2 font-mono text-xl font-bold">
                      {fmt(stat.value as number)}{" "}
                      <span className="text-xs text-[var(--text-faint)]">{stat.unit}</span>
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed rule px-6 py-10 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-faint)]">
                fund not yet capitalized
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-soft)]">
                Value, realized PnL, buybacks and burns appear here with explorer links once the
                fund is live. Real numbers only — losses included.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 7 — HOLDER ACCESS */}
      <section id="access" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="label">Holder eligibility</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            One floor. <span className="serif-italic font-normal">That&apos;s it.</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-soft)]">
            Rewards are automatic airdrops. No connect, no claiming, no tiers — the protocol scans
            holders on-chain and payouts land in your wallet.
          </p>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            {TIERS.filter((tier) => tier.min > 0).map((tier) => (
              <div key={tier.id} className="bracket border rule bg-[var(--ground)] p-8">
                <p className="font-mono text-5xl font-bold tracking-tight">
                  {fmt(tier.min)}
                </p>
                <p className="mt-1 text-sm text-[var(--text-soft)]">$ATTENTION minimum</p>
                <ul className="mt-6 space-y-2.5">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex gap-2 text-sm text-[var(--text-soft)]">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-orange)]" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <EligibilityPanel eligibleAt={MIN_ELIGIBLE} />
          </div>
        </div>
      </section>

      {/* COMING NEXT */}
      <section className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
          <p className="label">Coming next</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            The scanner goes <span className="serif-italic font-normal">live</span>.
          </h2>
          <div className="mt-8 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Live scanner feeds",
                body: "Real-time signal pulled from pump.fun, FOMO and X — calls fire from data, not vibes.",
              },
              {
                title: "X attention rewards",
                body: "Measured reach on X, paid to the wallet behind the attention.",
              },
              {
                title: "Fund transparency",
                body: "Every fund trade, buyback and burn on the dashboard with explorer links.",
              },
              {
                title: "Paid attention",
                body: "Projects pay to get attention across the protocol.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-[var(--ground)] p-6">
                <span className="block h-1 w-8 bg-[var(--color-orange)]" />
                <h3 className="mt-4 font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="blueprint">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Attention is <span className="serif-italic font-normal">currency</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-[var(--text-soft)]">
            Create attention. Earn $ATTENTION.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/terminal"
              className="bg-[var(--color-orange)] px-4 py-2.5 text-sm font-bold text-white"
            >
              Open Terminal
            </Link>
            <Link
              href="/scanner"
              className="border px-4 py-2.5 text-sm font-semibold rule hover:border-[var(--color-orange)]"
            >
              Attention Scanner
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
