import Link from "next/link";
import { LINKS, TOKEN } from "@/lib/config";
import { Marquee } from "./fx/Marquee";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-ink text-paper">
      <div className="border-b-2 border-paper/15 py-6">
        <Marquee duration={40} gap="2.5rem">
          {["Attention pays", "Nothing to claim", "Hold 250K", "Call it on 𝕏", "Burn every cycle"].map((t) => (
            <span key={t} className="display flex items-center gap-10 whitespace-nowrap text-5xl md:text-7xl">
              {t}
              <span className="text-cobalt">✺</span>
            </span>
          ))}
        </Marquee>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="min-w-0">
          <p className="display text-[clamp(1.35rem,6.4vw,1.9rem)]">
            Attention<span className="text-cobalt">.</span>Markets
          </p>
          <p className="mt-3 max-w-sm text-sm text-paper/70">
            Creator fees from ${TOKEN.symbol}, routed every cycle to holders, 𝕏 callers and the burn. Paid automatically. Nothing to claim.
          </p>
          <p className="mt-6 break-all font-mono text-xs text-paper/80">
            <span className="mr-2 bg-cobalt px-1.5 py-0.5 font-bold text-white">CA</span>
            {TOKEN.mint}
          </p>
        </div>
        <div className="grid content-start gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em]">
          <span className="text-paper/50">Site</span>
          <Link href="/x" className="hover:text-cobalt">𝕏 Pool</Link>
          <Link href="/rules" className="hover:text-cobalt">Payout rules</Link>
          <Link href="/scanner" className="hover:text-cobalt">Scanner</Link>
          <Link href="/fund" className="hover:text-cobalt">Fund</Link>
          <Link href="/advertise" className="hover:text-cobalt">Advertise</Link>
        </div>
        <div className="grid content-start gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em]">
          <span className="text-paper/50">Elsewhere</span>
          <a href={LINKS.x} target="_blank" rel="noopener noreferrer" className="hover:text-cobalt">𝕏 / Twitter</a>
          <a href={LINKS.pumpfun} target="_blank" rel="noopener noreferrer" className="hover:text-cobalt">pump.fun</a>
          <a href={LINKS.solscan} target="_blank" rel="noopener noreferrer" className="hover:text-cobalt">Solscan</a>
        </div>
      </div>
      <p className="mx-auto max-w-7xl px-4 pb-10 text-[11px] leading-relaxed text-paper/50">
        ${TOKEN.symbol} is a community memecoin. Nothing here is financial advice. Rewards only exist to the extent creator fees are
        collected, and no payout or return is guaranteed. We will never ask you to connect a wallet, sign anything or &ldquo;claim&rdquo;
        a reward: payouts arrive on their own.
      </p>
    </footer>
  );
}
