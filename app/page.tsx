import Link from "next/link";
import { CallerBoard } from "@/components/caller-board";
import { CopyCA } from "@/components/copy-ca";
import { EligibilityCheck } from "@/components/eligibility-check";
import { SectionHead } from "@/components/section-head";
import { Stamp } from "@/components/stamp";
import { Counter } from "@/components/fx/Counter";
import { Marquee } from "@/components/fx/Marquee";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { SplitText } from "@/components/fx/SplitText";
import { FEE_SPLIT, HOLDER_POOL, LINKS, MIN_ELIGIBLE, TOKEN, X_POOL } from "@/lib/config";
import { readCallers } from "@/lib/registry";
import { getChainStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-US");

const FAQ = [
  {
    q: "Do I need to claim anything?",
    a: "No. Payouts are sent straight to your wallet by the payout worker. No connecting, no signing, no claim button. Anything asking you to sign to “claim” is a scam.",
  },
  {
    q: "How is the holder pool split?",
    a: `Every wallet holding ${fmt(MIN_ELIGIBLE)}+ $${TOKEN.symbol} gets a share proportional to its balance, capped at ${HOLDER_POOL.capBps / 100}% of the pot per wallet (the excess is re-split). Pools, curves and burn addresses are excluded.`,
  },
  {
    q: "How is the 𝕏 pool scored?",
    a: `One verified 𝕏 account = one equal share, as long as its wallet holds ${fmt(MIN_ELIGIBLE)}+. A callout counts for ${X_POOL.windowDays} days from when you posted it; post a fresh one to stay in. No follower counts, no engagement guessing: you can check every seat on /x.`,
  },
  {
    q: "Why does linking need a post, not a login?",
    a: "Your post carries a code generated from your wallet address. We read the public post through 𝕏's free embed endpoint and check the author, the phrase and the code. No 𝕏 login, no API keys, no permissions on your account.",
  },
  {
    q: "Where does the money come from?",
    a: "pump.fun creator fees on $ATTENTION trades. They're claimed and routed each cycle: 50% holders, 40% to the 𝕏 pool wallet, 10% market-bought and burned. If nobody trades, there are no fees, and nothing is promised.",
  },
];

export default async function HomePage() {
  const [{ view }, stats] = await Promise.all([readCallers(), getChainStats()]);
  const now = Date.now();
  const callers = view.seats.length;

  return (
    <>
      {/* TICKER */}
      <div className="border-b-2 border-ink bg-ink py-2 text-paper">
        <Marquee duration={32} gap="2rem">
          {["50% to holders", "40% to 𝕏 callers", "10% buyback & burn", "Nothing to claim", `Hold ${fmt(MIN_ELIGIBLE)}`, "Paid in SOL"].map((t) => (
            <span key={t} className="flex items-center gap-8 whitespace-nowrap font-mono text-xs font-extrabold uppercase tracking-[0.16em]">
              {t}
              <span className="text-cobalt">✺</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* HERO: masthead */}
      <section className="paper relative overflow-hidden border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-8 md:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3 font-mono text-[11px] font-extrabold uppercase tracking-[0.16em]">
            <span>Issue Nº 01 · Solana</span>
            <span className="flex items-center gap-2">
              <span className="live-dot" /> Fees route every {HOLDER_POOL.intervalMinutes} min
            </span>
          </div>

          <SplitText text="ATTENTION" className="display mt-6 text-[clamp(2.4rem,calc((100vw-2rem)/7.6),10rem)]" />
          <div className="flex flex-wrap items-center gap-x-8">
            <SplitText text="PAYS." as="p" delay={0.25} className="display text-[clamp(2.4rem,calc((100vw-2rem)/7.6),10rem)] text-cobalt" />
            <Reveal delay={0.5} className="hidden w-32 md:block lg:w-36">
              <Stamp text="NOTHING TO CLAIM ✺ NOTHING TO SIGN ✺ " />
            </Reveal>
          </div>

          <div className="mt-10 grid gap-8 border-t-2 border-ink pt-8 md:grid-cols-12">
            <Reveal className="md:col-span-7">
              <p className="serif-italic text-pretty text-3xl leading-tight md:text-[2.6rem]">
                A memecoin that pays the people who hold it <span className="text-cobalt">and</span> the people who talk about it.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-5">
              <p className="text-pretty text-ink-soft">
                Every cycle, ${TOKEN.symbol}&apos;s pump.fun creator fees are claimed and split: half to every holder of {fmt(MIN_ELIGIBLE)}+,
                40% to verified 𝕏 callers, 10% bought back and burned. Sent to your wallet automatically.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={LINKS.pumpfun} target="_blank" rel="noopener noreferrer" className="btn btn-cobalt">
                  Buy ${TOKEN.symbol} ↗
                </a>
                <Link href="/x" className="btn btn-paper">
                  Get your 𝕏 code
                </Link>
              </div>
              <CopyCA className="mt-4 w-full" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* THE SPLIT */}
      <section id="split" className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <SectionHead no="01" kicker="Where every fee goes" title={<>The <span className="serif-italic text-cobalt">split</span></>}>
            Hard-coded in one config file and mirrored in the payout worker. The numbers on this page are the numbers that get sent.
          </SectionHead>
          <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
            {FEE_SPLIT.map((b, i) => (
              <RevealItem key={b.id}>
                <article className={`panel lift flex h-full flex-col p-6 ${i === 1 ? "!bg-cobalt text-white" : i === 2 ? "!bg-ink text-paper" : ""}`}>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[11px] font-extrabold uppercase tracking-[0.14em]">{b.name}</span>
                    <span className="font-mono text-[11px] font-bold opacity-70">0{i + 1}</span>
                  </div>
                  <p className="condensed mt-4 text-[clamp(7rem,16vw,11rem)]">
                    <Counter value={b.percent} suffix="%" />
                  </p>
                  <p className="display mt-2 text-2xl">{b.tagline}</p>
                  <p className="mt-3 text-sm opacity-85">{b.detail}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* MARQUEE HEADLINE */}
      <section aria-label="Hold it, call it, get paid" className="overflow-hidden border-b-2 border-ink bg-cobalt py-6 text-white md:py-10">
        <Marquee duration={26} gap="3rem">
          {["Hold it", "Call it", "Get paid"].map((t, i) => (
            <span key={t} className={`display flex items-center gap-12 whitespace-nowrap text-[clamp(4rem,12vw,10rem)] ${i === 1 ? "text-ink" : ""}`}>
              {t}
              <span>✺</span>
            </span>
          ))}
        </Marquee>
        <Marquee duration={34} gap="3rem" reverse className="mt-2">
          {["Nothing to claim", "Nothing to sign", "Paid in SOL"].map((t) => (
            <span key={t} className="display outline-text flex items-center gap-12 whitespace-nowrap text-[clamp(3rem,8vw,7rem)] [-webkit-text-stroke-color:#fff]">
              {t}
              <span>✺</span>
            </span>
          ))}
        </Marquee>
      </section>

      {/* NUMBERS */}
      <section className="paper border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <SectionHead no="02" kicker="Live, from chain" title={<>By the <span className="serif-italic text-cobalt">numbers</span></>}>
            Read straight from Solana and from the caller registry. When a read fails you&apos;ll see a dash, never a made-up number.
          </SectionHead>
          <RevealGroup className="mt-12 grid grid-cols-2 border-2 border-ink bg-white md:grid-cols-4">
            {[
              { k: "𝕏 callers live", v: callers, d: 0, pre: "", suf: "" },
              { k: "Market cap", v: stats?.curve?.mcapSol ?? null, d: 1, pre: "◎", suf: "" },
              { k: "Bonding curve", v: stats?.curve ? stats.curve.progress * 100 : null, d: 2, pre: "", suf: "%" },
              { k: `$${TOKEN.symbol} burned`, v: stats?.burned ?? null, d: 0, pre: "", suf: "" },
            ].map((s, i) => (
              <RevealItem key={s.k} className={`border-ink p-5 md:p-7 ${i % 2 === 0 ? "border-r-2" : ""} ${i < 2 ? "border-b-2 md:border-b-0" : ""} ${i === 1 ? "md:border-r-2" : ""}`}>
                <p className="label !text-ink">{s.k}</p>
                <p className="condensed mt-3 truncate text-[clamp(3.2rem,9vw,6.5rem)]">
                  {s.v === null ? "—" : <Counter value={s.v} decimals={s.d} prefix={s.pre} suffix={s.suf} />}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <p className="mt-4 font-mono text-[11px] text-ink-faint">
            Market cap in SOL from the pump.fun bonding curve · burned = 1,000,000,000 minus current supply · callers = live verified seats.
          </p>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <SectionHead no="03" kicker="Two ways in" title={<>How you get <span className="serif-italic text-cobalt">paid</span></>} />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <article className="panel h-full p-6 md:p-8">
                <p className="label !text-ink">Holders · 50%</p>
                <p className="display mt-4 text-5xl md:text-6xl">Hold {fmt(MIN_ELIGIBLE / 1000)}K.</p>
                <p className="display text-5xl text-cobalt md:text-6xl">That&apos;s it.</p>
                <p className="mt-5 text-ink-soft">
                  The worker snapshots every holder on-chain each cycle and pays pro-rata in SOL. Holding is the registration. No sign-up, no
                  wallet connect.
                </p>
              </article>
            </Reveal>
            <Reveal delay={0.1}>
              <article className="panel h-full !bg-ink p-6 text-paper md:p-8">
                <p className="label !text-paper/70">𝕏 callers · 40%</p>
                <ol className="mt-4 grid gap-5">
                  {[
                    ["Get your code", "Paste the wallet you want paid. You get a phrase with a code only that wallet can use."],
                    ["Post your callout", `Put the phrase in a public post on 𝕏. Say whatever else you want about $${TOKEN.symbol}.`],
                    ["Paste the link", `We verify it in seconds. Your seat lasts ${X_POOL.windowDays} days: post again to renew.`],
                  ].map(([t, d], i) => (
                    <li key={t} className="grid grid-cols-[auto_1fr] gap-4">
                      <span className="condensed text-6xl leading-none text-cobalt">{i + 1}</span>
                      <span>
                        <span className="display block text-2xl">{t}</span>
                        <span className="text-sm text-paper/75">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <Link href="/x" className="btn btn-cobalt mt-6 !border-paper">
                  Link my 𝕏 →
                </Link>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CHECK */}
      <section id="check" className="paper border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <SectionHead no="04" kicker="Eligibility" title={<>Am I <span className="serif-italic text-cobalt">in?</span></>}>
            Paste any wallet to see where it stands in both pools.
          </SectionHead>
          <Reveal className="mt-10">
            <EligibilityCheck />
          </Reveal>
        </div>
      </section>

      {/* CALLERS */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <SectionHead no="05" kicker="The 𝕏 pool, live" title={<>The <span className="serif-italic text-cobalt">callers</span></>}>
            Every verified seat, public. Each one gets an equal share of the 𝕏 pool while its callout is live and its wallet holds{" "}
            {fmt(MIN_ELIGIBLE)}+.
          </SectionHead>
          <Reveal className="mt-10">
            <CallerBoard seats={view.seats} windowDays={view.windowDays} limit={8} now={now} />
          </Reveal>
          {callers > 8 ? (
            <Link href="/x" className="btn btn-paper mt-6">
              All {callers} callers →
            </Link>
          ) : null}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="paper border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-5">
            <SectionHead no="06" kicker="Straight answers" title={<>F.A.Q.</>} />
            <Link href="/rules" className="btn btn-ink mt-8">
              Full payout rules
            </Link>
          </div>
          <RevealGroup className="grid content-start gap-4 md:col-span-7">
            {FAQ.map((f) => (
              <RevealItem key={f.q}>
                <details className="group border-2 border-ink bg-white open:shadow-[6px_6px_0_0_var(--color-cobalt)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold [&::-webkit-details-marker]:hidden">
                    <span className="text-lg">{f.q}</span>
                    <span className="display text-2xl text-cobalt transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="border-t-2 border-ink px-5 py-4 text-ink-soft">{f.a}</p>
                </details>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-cobalt text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center md:py-32">
          <Reveal>
            <p className="label !text-white/80">Your move</p>
            <h2 className="display mt-4 text-[clamp(3rem,11vw,9rem)]">
              Get <span className="text-ink">paid</span> for
              <br />
              paying attention.
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a href={LINKS.pumpfun} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
                Buy on pump.fun ↗
              </a>
              <Link href="/x" className="btn btn-paper">
                Join the 𝕏 pool
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
