import Link from "next/link";
import { Mark } from "./mark";
import { LINKS, TOKEN } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Mark className="h-8 w-8" />
          <div>
            <p className="font-extrabold tracking-tight">
              Attention <span className="serif-italic font-normal">Markets</span>
            </p>
            <p className="label mt-0.5">Attention is currency</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--text-soft)]">
          <Link href="/scanner" className="hover:text-[var(--color-orange)]">
            Scanner
          </Link>
          <Link href="/terminal" className="hover:text-[var(--color-orange)]">
            Terminal
          </Link>
          <Link href="/fund" className="hover:text-[var(--color-orange)]">
            Fund
          </Link>
          <Link href="/#how" className="hover:text-[var(--color-orange)]">
            Mechanics
          </Link>
          <Link href="/advertise" className="hover:text-[var(--color-orange)]">
            Advertise
          </Link>
          <a href={LINKS.x} className="hover:text-[var(--color-orange)]">
            X
          </a>
          {LINKS.pumpfun ? (
            <a href={LINKS.pumpfun} className="hover:text-[var(--color-orange)]">
              pump.fun
            </a>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-10">
        <p className="max-w-3xl text-xs leading-relaxed text-[var(--text-faint)]">
          {TOKEN.symbol} is a community token. Nothing here is financial advice, and no reward,
          payout or return is guaranteed — reward pools only exist to the extent fees are
          collected. Callouts and terminal data are information, not recommendations. Never sign a
          transaction you do not understand.
        </p>
      </div>
    </footer>
  );
}
