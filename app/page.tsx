import Link from "next/link";
import { ContractAddress } from "@/components/contract-address";
import { TokenStats } from "@/components/token-stats";
import { Scramble } from "@/components/scramble";
import { CipherField } from "@/components/cipher-field";
import { ConfidentialCard } from "@/components/confidential-card";
import { RevealOnScroll } from "@/components/reveal";
import { LINKS, MIN_ELIGIBLE, TOKEN } from "@/lib/config";

/** Live token stats where a mint is configured; otherwise static. */
export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-US");

const PRINCIPLES = ["No tracking", "No accounts", "No gatekeepers", "Zero-knowledge", "Community-owned", "Privacy is a right"];

const STEPS = [
  {
    n: "01",
    title: "Encrypt",
    body: "Your balance and transfer amounts are encrypted on-chain with twisted ElGamal encryption. Only you hold the key to read them.",
  },
  {
    n: "02",
    title: "Prove",
    body: "Your wallet attaches zero-knowledge proofs: the amount is in range and you can afford it. The proof reveals nothing else.",
  },
  {
    n: "03",
    title: "Verify",
    body: "Solana validators check the proofs and settle the transfer. They confirm it is valid without ever seeing a number.",
  },
];

const FAQ = [
  {
    q: "Is PRVC a mixer?",
    a: "No. PRVC does not mix, tumble or launder anything, and it never breaks transaction provenance. It is a community token that champions the compliant privacy already built into Solana: hiding amounts, not hiding where funds came from.",
  },
  {
    q: "How do holders get rewarded?",
    a: `Creator fees are shared back to holders. The protocol scans holders on-chain and airdrops straight to wallets holding at least ${fmt(MIN_ELIGIBLE)} ${TOKEN.symbol}. There is nothing to connect, sign or claim.`,
  },
  {
    q: "Do I need to connect my wallet?",
    a: "Never. If anything asks you to connect or sign to “claim” PRVC rewards, it is a scam. Payouts find your wallet on their own.",
  },
  {
    q: "What privacy tech is this about?",
    a: "Solana's Token-2022 Confidential Transfers: encrypted balances plus zero-knowledge proofs that validators verify. The transfer card above illustrates how a confidential transfer looks compared with a public one.",
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
              Privacy on Solana
            </p>
            <h1 className="mt-6 text-[clamp(3.2rem,9vw,7.5rem)] font-extrabold leading-[0.88] tracking-[-0.045em]">
              <Scramble text="Privacy" className="block" />
              <span className="block">
                is a <span className="serif-italic font-normal text-[var(--color-orange)]">right</span>.
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-[var(--text-soft)]">
              <strong className="text-[var(--text)]">{TOKEN.symbol}</strong> is the community token for financial privacy on
              Solana. No tracking, no gatekeepers. Hold it and share in the creator fees, airdropped automatically.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {LINKS.pumpfun ? (
                <a href={LINKS.pumpfun} className="btn-primary">
                  Buy {TOKEN.symbol} <span aria-hidden="true">→</span>
                </a>
              ) : (
                <span className="btn-primary opacity-70" aria-disabled="true">
                  Launching soon
                </span>
              )}
              <Link href="#how" className="btn-ghost">
                How privacy works
              </Link>
              <a href={LINKS.x} className="btn-ghost" aria-label="PRVC on X">
                𝕏
              </a>
            </div>
            <ContractAddress className="mt-5" />
          </div>

          <div className="flex justify-center md:justify-end" data-reveal>
            <ConfidentialCard />
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

      {/* WHAT PRVC IS */}
      <section id="about" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div data-reveal className="max-w-3xl">
            <p className="label">What PRVC is</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              Your money is <span className="serif-italic font-normal">your business</span>.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-soft)]">
              On most chains anyone can read your balance and every payment you have ever made. PRVC stands for the opposite,
              and points at the privacy technology Solana already ships.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              { k: "ZK", title: "Real privacy tech", body: "Built on Solana's confidential-transfer cryptography: hide amounts, keep provenance." },
              { k: "∅", title: "No surveillance", body: "No accounts, no wallet tracking, no data harvesting. Holding is the only thing that matters." },
              { k: "100%", title: "Community-owned", body: "Creator fees flow back to holders automatically. No team allocation gate, no lockups." },
            ].map((c, i) => (
              <div key={c.title} className="card" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="font-mono text-3xl font-bold text-[var(--color-orange)]">{c.k}</span>
                <h3 className="mt-6 text-lg font-bold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{c.body}</p>
              </div>
            ))}
          </div>

          <div data-reveal className="spec mt-10">
            <span className="label text-[var(--color-orange)]">Plainly</span>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">
              <strong className="text-[var(--text)]">PRVC is not a mixer or a tumbler.</strong> It does not launder funds, break
              transaction provenance or promise &quot;clean&quot; coins. It champions legitimate, compliant financial privacy:
              the kind already built into Solana.
            </p>
          </div>
        </div>
      </section>

      {/* HOW PRIVACY WORKS */}
      <section id="how" className="relative border-b rule bg-[var(--ground-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div data-reveal className="max-w-3xl">
            <p className="label">How privacy works on Solana</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              Verified, <span className="serif-italic font-normal">never revealed</span>.
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
          <p className="mt-6 text-xs text-[var(--text-faint)]">Based on Solana Token-2022 Confidential Transfers. The transfer card at the top is an illustration, not a live transaction.</p>
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
            Own your <span className="serif-italic font-normal text-[var(--color-orange)]">privacy</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[var(--text-soft)]">Privacy is a right, not a feature.</p>
          <div className="mt-10 flex justify-center gap-3">
            {LINKS.pumpfun ? (
              <a href={LINKS.pumpfun} className="btn-primary">
                Buy {TOKEN.symbol} <span aria-hidden="true">→</span>
              </a>
            ) : null}
            <a href={LINKS.x} className="btn-ghost">
              Follow on 𝕏
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
