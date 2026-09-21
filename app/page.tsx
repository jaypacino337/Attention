import Link from "next/link";
import { MarkHero } from "@/components/mark";
import { ContractAddress } from "@/components/contract-address";
import { TokenStats } from "@/components/token-stats";
import { LINKS, MIN_ELIGIBLE, TOKEN } from "@/lib/config";

/** Live token stats where a mint is configured; otherwise static. */
export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-US");

export default async function HomePage() {
  return (
    <>
      <TokenStats />

      {/* HERO */}
      <section className="blueprint border-b rule">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="label">Privacy on Solana</p>
            <h1 className="mt-4 text-6xl font-extrabold leading-[0.9] tracking-tight md:text-8xl">
              PRVC
            </h1>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-px w-16 bg-[var(--text)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-orange)]" />
            </div>
            <p className="mt-6 max-w-md text-xl font-bold leading-snug">
              Privacy is a{" "}
              <span className="serif-italic font-normal text-[var(--color-orange)]">right</span>,
              not a feature.
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--text-soft)]">
              A privacy-first community token on Solana. No tracking, no gatekeepers — hold PRVC and
              share automatically in the protocol&apos;s creator fees.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {LINKS.pumpfun ? (
                <a
                  href={LINKS.pumpfun}
                  className="bg-[var(--color-orange)] px-4 py-2.5 text-sm font-bold text-[var(--ground)]"
                >
                  Buy PRVC
                </a>
              ) : null}
              <Link
                href="#about"
                className="border px-4 py-2.5 text-sm font-semibold rule hover:border-[var(--color-orange)]"
              >
                How it works
              </Link>
              <a
                href={LINKS.x}
                className="border px-4 py-2.5 text-sm font-semibold rule hover:border-[var(--color-orange)]"
              >
                𝕏
              </a>
            </div>

            <ContractAddress className="mt-4" />
          </div>

          <div className="mx-auto w-full max-w-xs text-[var(--text)] md:max-w-md">
            <MarkHero />
          </div>
        </div>
      </section>

      {/* ABOUT — honest, factual, no mixer claims */}
      <section id="about" className="border-b rule">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className="label">What PRVC is</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Privacy, <span className="serif-italic font-normal">by default</span>.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-soft)]">
            PRVC is a community token that stands for financial privacy on Solana. It rides the same
            values as Zcash and the wider privacy movement, and it points at the privacy technology
            Solana already ships — like Token-2022 Confidential Transfers, which use zero-knowledge
            proofs to keep transfer amounts private on-chain.
          </p>

          <div className="mt-10 grid gap-px bg-[var(--line)] sm:grid-cols-3">
            {[
              {
                title: "Real privacy tech",
                body: "Grounded in Solana's on-chain confidential-transfer cryptography — hiding amounts, not hiding provenance.",
              },
              {
                title: "No surveillance",
                body: "No wallet tracking, no accounts, no data harvesting. Holding is the only thing that matters.",
              },
              {
                title: "Community-owned",
                body: "Creator fees flow back to holders automatically. No team allocation gate, no lockups.",
              },
            ].map((card) => (
              <div key={card.title} className="bg-[var(--ground)] p-6">
                <span className="block h-1 w-8 bg-[var(--color-orange)]" />
                <h3 className="mt-4 font-bold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{card.body}</p>
              </div>
            ))}
          </div>

          {/* Honest boundary — say plainly what PRVC is NOT. */}
          <p className="mt-8 max-w-2xl border-l-2 border-[var(--color-orange)] pl-4 text-sm leading-relaxed text-[var(--text-soft)]">
            <strong className="text-[var(--text)]">PRVC is not a mixer or a tumbler.</strong> It
            does not launder funds, break transaction provenance, or promise &quot;clean&quot; coins.
            It is a token that champions legitimate, compliant financial privacy — the kind already
            built into Solana.
          </p>
        </div>
      </section>

      {/* EARN — the real, generic mechanic */}
      <section id="rewards" className="border-b rule bg-[var(--ground-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className="label">Hold &amp; earn</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Fees flow to <span className="serif-italic font-normal">holders</span>.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-soft)]">
            Creator fees are shared back with the people holding PRVC — scanned on-chain and
            airdropped straight to your wallet. No connecting, no signing, no claiming. Holding is
            the registration.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="border rule px-3 py-2 font-mono text-sm font-bold">
              {fmt(MIN_ELIGIBLE)} {TOKEN.symbol}
            </span>
            <span className="text-sm text-[var(--text-soft)]">minimum to qualify — that&apos;s it.</span>
          </div>

          <p className="mt-6 max-w-2xl border-l-2 border-[var(--color-orange)] pl-4 text-sm text-[var(--text-soft)]">
            If anything ever asks you to connect a wallet or sign to &quot;claim rewards&quot; from
            us, it&apos;s a scam. Payouts find your wallet on their own.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="blueprint">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Own your <span className="serif-italic font-normal">privacy</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-[var(--text-soft)]">
            Privacy is a right, not a feature.
          </p>
          {LINKS.pumpfun ? (
            <div className="mt-8 flex justify-center">
              <a
                href={LINKS.pumpfun}
                className="bg-[var(--color-orange)] px-5 py-2.5 text-sm font-bold text-[var(--ground)]"
              >
                Buy PRVC
              </a>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
