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
            <p className="font-extrabold tracking-tight">PRVC</p>
            <p className="label mt-0.5">Private swaps and sends on Solana</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--text-soft)]">
          <Link href="/swap" className="hover:text-[var(--color-orange)]">
            Swap
          </Link>
          <Link href="/send" className="hover:text-[var(--color-orange)]">
            Send
          </Link>
          <Link href="/docs" className="hover:text-[var(--color-orange)]">
            Docs
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
        {TOKEN.mint ? (
          <p className="mb-4 break-all font-mono text-xs text-[var(--text-soft)]">
            <span className="label mr-2">CA</span>
            {TOKEN.mint}
          </p>
        ) : null}
        <p className="max-w-3xl text-xs leading-relaxed text-[var(--text-faint)]">
          {TOKEN.symbol} is a community token. Nothing here is financial advice, and no reward,
          payout or return is guaranteed — reward pools only exist to the extent fees are collected.
          The Send and Swap tools are non-custodial software that runs in your browser; you sign every
          transaction yourself and are responsible for using them lawfully. Never sign a transaction you
          do not understand.
        </p>
      </div>
    </footer>
  );
}
