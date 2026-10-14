import Link from "next/link";
import { ContractAddress } from "@/components/contract-address";
import { TokenStats } from "@/components/token-stats";
import { Scramble } from "@/components/scramble";
import { CipherField } from "@/components/cipher-field";
import { HeroRoute } from "@/components/hero-route";
import { ByteBudget } from "@/components/byte-budget";
import { RevealOnScroll } from "@/components/reveal";
import { LINKS, MIN_ELIGIBLE, TOKEN } from "@/lib/config";

/** Live token stats where a mint is configured; otherwise static. */
export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-US");

const PRINCIPLES = ["Private sends", "Swap to anyone", "One signature", "Zero custody", "All or nothing", "Privacy is a right"];

const STEPS = [
  {
    n: "01",
    title: "Build",
    body: "Your browser splits the amount into uneven parts, makes fresh throwaway relay wallets and adds decoys sized just like the real parts.",
  },
  {
    n: "02",
    title: "Sign once",
    body: "You approve one transaction. The relays co-sign it, then their keys are thrown away. PRVC never holds your funds or your keys.",
  },
  {
    n: "03",
    title: "Settle",
    body: "Everything lands in a single atomic transaction. Every relay ends at zero, decoys come home, and if any step fails nothing moves at all.",
  },
];

const FAQ = [
  {
    q: "What does Send actually do?",
    a: "It splits your SOL into parts and routes them through throwaway relay wallets, mixed with look-alike decoys that return to you, all inside one transaction you sign. Explorers and wallet trackers see a tangle of transfers between fresh wallets, not one clean line from you to them.",
  },
  {
    q: "Is it safe? Who holds my funds?",
    a: "Nobody but you. Routes are built in your browser, the transaction is all-or-nothing, relays always end at zero, and PRVC has no contract, pool or wallet that ever touches your money. Every send is simulated before you are asked to sign.",
  },
  {
    q: "How private is it, honestly?",
    a: "It breaks the obvious link that explorers, trackers and casual watchers rely on. Someone who decodes the full transaction instruction by instruction can still follow it, so treat it as strong everyday privacy, not invisibility. Use it lawfully.",
  },
  {
    q: "What does it cost?",
    a: "PRVC charges nothing. You pay the normal Solana network fee for one transaction, a fraction of a cent, plus Jupiter's pool fees on swaps.",
  },
  {
    q: "How do holders get rewarded?",
    a: `Creator fees are shared back to holders. The protocol scans holders on-chain and airdrops straight to wallets holding at least ${fmt(MIN_ELIGIBLE)} ${TOKEN.symbol}. There is nothing to claim, and anyone asking you to sign to “claim” is a scammer.`,
  },
];

export default async function HomePage() {
  return (
    <>
      <RevealOnScroll />
      <TokenStats />

      {/* HERO */}
      <section className="relative overflow-hidden border-b rule">
        <CipherField />
        <div className="hero-glow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:min-h-[86vh] md:grid-cols-[1.15fr_1fr] md:pb-24 md:pt-20">
          <div>
            <p className="label flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-orange)] pulse" />
              Private sends &amp; swaps on Solana
            </p>
            <h1 className="mt-6 text-[clamp(3.2rem,9vw,7.5rem)] font-extrabold leading-[0.88] tracking-[-0.045em]">
              <Scramble text="Privacy" className="block" />
              <span className="block">
                is a <span className="serif-italic font-normal text-[var(--color-orange)]">right</span>.
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-[var(--text-soft)]">
              <strong className="text-[var(--text)]">{TOKEN.symbol}</strong> routes your sends through throwaway relays and
              look-alike decoys, all packed into one transaction you sign. Or swap straight into someone&apos;s wallet so it
              reads as your own trade.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/send" className="btn-primary">
                Send privately <span aria-hidden="true">→</span>
              </Link>
              <Link href="/swap" className="btn-ghost">
                Open swap
              </Link>
              {LINKS.pumpfun ? (
                <a href={LINKS.pumpfun} className="btn-ghost">
                  Buy {TOKEN.symbol}
                </a>
              ) : null}
            </div>
            <ContractAddress className="mt-5" />
          </div>

          <div className="flex justify-center md:justify-end" data-reveal>
            <HeroRoute />
          </div>
        </div>
      </section>

      {/* PRINCIPLES MARQUEE */}
      <div className="marquee border-b rule" aria-label="PRVC principles">
        <div className="marquee-track">
          {[...PRINCIPLES, ...PRINCIPLES].map((p, i) => (
            <span key={i} className="flex items-center gap-6 px-6 font-mono text-xs font-bold uppercase tracking-[0.3em] text-[var(--text-soft)]">
              {p}
              <span className="h-1 w-1 rotate-45 bg-[var(--color-orange)]" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>

      {/* TWO WAYS IN */}
      <section id="tools" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div data-reveal className="max-w-3xl">
            <p className="label">Two ways in</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              Pick how the <span className="serif-italic font-normal">money moves</span>.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-soft)]">
              Both end the same way: the money arrives, and nothing on an explorer draws a straight line from you to them.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2">
            <div className="card flex flex-col" data-reveal>
              <span className="label text-[var(--color-orange)]">Swap</span>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight">Pay in the token they want.</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">The output lands in their wallet, and on-chain it reads as your own swap.</p>
              <div className="mt-6 border rule font-mono text-xs">
                <p className="border-b rule px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Balance changes, as an explorer lists them</p>
                {[
                  ["You", "SOL", "−12.50 SOL", "text-[var(--text)]"],
                  ["Swap route", "pools", "in and out", "text-[var(--text-soft)]"],
                  ["Recipient", "USDC account", "+1,484.10 USDC", "text-[var(--color-orange)]"],
                ].map(([w, a, v, c]) => (
                  <div key={w} className="flex items-center justify-between border-b rule px-3 py-2.5 last:border-b-0">
                    <span><span className="text-[var(--text)]">{w}</span> <span className="text-[var(--text-faint)]">{a}</span></span>
                    <span className={c}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="label">Transfers to them</p><p className="mt-1 font-mono text-2xl font-bold">0</p></div>
                <div><p className="label">Reads as</p><p className="mt-1 font-bold">a swap by you</p></div>
              </div>
              <Link href="/swap" className="btn-ghost mt-6 self-start">Open swap →</Link>
            </div>

            <div className="card flex flex-col" data-reveal style={{ transitionDelay: "90ms" }}>
              <span className="label text-[var(--color-orange)]">Send</span>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight">SOL through relays and decoys.</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">Split into parts and relayed through throwaway wallets, with decoys sized just like them.</p>
              <div className="mt-6 grid grid-cols-3 gap-px border rule bg-[var(--line)] text-center">
                {[["up to 25", "transfers"], ["1", "signature"], ["0", "left in relays"]].map(([n, l]) => (
                  <div key={l} className="bg-[var(--ground-raised)] px-2 py-5">
                    <p className="font-mono text-2xl font-black text-[var(--color-orange)]">{n}</p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">{l}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-2 text-sm text-[var(--text-soft)]">
                <li>→ Fresh relay wallets made in your browser, every time</li>
                <li>→ Decoys leave you and come straight back</li>
                <li>→ All or nothing: one atomic transaction</li>
              </ul>
              <Link href="/send" className="btn-ghost mt-auto self-start pt-3">Send privately →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW PRIVACY WORKS */}
      <section id="how" className="relative border-b rule bg-[var(--ground-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div data-reveal className="max-w-3xl">
            <p className="label">How a send works</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              One signature, <span className="serif-italic font-normal">many paths</span>.
            </h2>
          </div>
          <ol className="mt-14 grid gap-px overflow-hidden border rule bg-[var(--line)] md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.n} className="step bg-[var(--ground-raised)] p-7 md:p-8" data-reveal style={{ transitionDelay: `${i * 110}ms` }}>
                <span className="font-mono text-xs font-bold tracking-widest text-[var(--color-orange)]">{s.n}</span>
                <h3 className="mt-10 text-2xl font-extrabold tracking-tight">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ROOM TO SPARE */}
      <section id="bytes" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div data-reveal className="max-w-3xl">
            <p className="label">Room to spare</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              The whole route fits in <span className="serif-italic font-normal">one transaction</span>.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-soft)]">
              A Solana transaction holds 1,232 bytes, and every wallet can sign one. Here is a real send at each level,
              built by the same code as the Send page and measured byte by byte. Every square is 16 bytes.
            </p>
          </div>
          <div className="mt-12" data-reveal><ByteBudget /></div>
        </div>
      </section>

      {/* HOLD & EARN */}
      <section id="rewards" className="border-b rule">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 md:grid-cols-2 md:py-28">
          <div data-reveal>
            <p className="label">Hold &amp; earn</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              Fees flow to <span className="serif-italic font-normal">holders</span>.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-soft)]">
              Creator fees are shared back with the people holding {TOKEN.symbol}, scanned on-chain and airdropped straight to
              your wallet. No connecting, no signing, no claiming. Holding is the registration.
            </p>
            <div className="mt-8 inline-flex items-baseline gap-3 border rule px-4 py-3">
              <span className="font-mono text-2xl font-bold">{fmt(MIN_ELIGIBLE)}</span>
              <span className="text-sm text-[var(--text-soft)]">{TOKEN.symbol} minimum. That&apos;s it.</span>
            </div>
            <p className="spec mt-8 text-sm text-[var(--text-soft)]">
              If anything asks you to connect a wallet or sign to &quot;claim rewards&quot; from us, it&apos;s a scam. Payouts
              find your wallet on their own.
            </p>
          </div>

          <div data-reveal className="flow" aria-label="How fees reach holders">
            {[
              { t: "Trading fees", d: `Every ${TOKEN.symbol} trade on pump.fun earns creator fees.` },
              { t: "On-chain scan", d: "The protocol reads every holder straight from the chain." },
              { t: "Airdrop", d: `Fees are sent to wallets holding ${fmt(MIN_ELIGIBLE)}+ ${TOKEN.symbol}.` },
            ].map((s, i) => (
              <div key={s.t} className="flow-step">
                <span className="flow-dot">{i + 1}</span>
                <div>
                  <h3 className="font-bold">{s.t}</h3>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b rule">
        <div className="mx-auto max-w-3xl px-5 py-20 md:py-28">
          <p className="label" data-reveal>Questions</p>
          <h2 data-reveal className="mt-4 text-[clamp(2.2rem,4.5vw,3.5rem)] font-extrabold tracking-[-0.03em]">
            Straight answers.
          </h2>
          <div className="mt-10 border-t rule">
            {FAQ.map((f) => (
              <details key={f.q} className="faq border-b rule" data-reveal>
                <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-lg font-bold">
                  {f.q}
                  <span className="faq-icon" aria-hidden="true">+</span>
                </summary>
                <p className="pb-6 pr-10 text-[15px] leading-relaxed text-[var(--text-soft)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="hero-glow cta-glow" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-5 py-28 text-center md:py-36" data-reveal>
          <h2 className="mx-auto max-w-4xl text-[clamp(2.8rem,8vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em]">
            Step into <span className="serif-italic font-normal text-[var(--color-orange)]">privacy</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[var(--text-soft)]">Connect a wallet, pick a level, sign once.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/send" className="btn-primary">
              Send privately <span aria-hidden="true">→</span>
            </Link>
            <Link href="/swap" className="btn-ghost">
              Open swap
            </Link>
            <a href={LINKS.x} className="btn-ghost">
              Follow on 𝕏
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
