import type { Metadata } from "next";
import Link from "next/link";
import { ConnectButton, ConnectError } from "@/components/connect-button";
import { TerminalPanels } from "@/components/terminal-panels";
import { loadAccount } from "@/lib/account";
import { TERMINAL_GATE, TOKEN, WALLET_ENABLED } from "@/lib/config";
import { getTerminalFeed } from "@/lib/terminal";
import { loadScannerCalls } from "@/lib/scanner";
import { getLeaderboard } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Attention Terminal" };
/** Gating depends on a live balance read, so this page can never be static. */
export const dynamic = "force-dynamic";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <p className="label">
        {WALLET_ENABLED ? `Token-gated · ${fmt(TERMINAL_GATE)} ${TOKEN.symbol}` : "Live intelligence"}
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
        Attention <span className="serif-italic font-normal">Terminal</span>
      </h1>
      <p className="mt-3 max-w-md text-sm text-[var(--text-soft)]">
        Where attention is <strong className="text-[var(--text)]">now</strong>. For where it may be
        going next, open the <a href="/scanner" className="font-semibold text-[var(--color-orange)] underline underline-offset-4">Scanner</a>.
      </p>
      {children}
    </section>
  );
}

export default async function TerminalPage() {
  // Wallet connect is off: rewards are automatic airdrops, so there is no
  // per-wallet session to gate on — the terminal is public.
  if (!WALLET_ENABLED) {
    const [feed, scannerCalls, leaderboard] = await Promise.all([
      getTerminalFeed(),
      loadScannerCalls(),
      getLeaderboard(),
    ]);
    return (
      <Shell>
        {feed.source === "manual" ? (
          <p className="label mt-6">curated by the team</p>
        ) : null}
        <div className="mt-8">
          <TerminalPanels feed={feed} scannerCalls={scannerCalls} leaderboard={leaderboard} />
        </div>
      </Shell>
    );
  }

  const account = await loadAccount();

  if (!account) {
    return (
      <Shell>
        <div className="mt-8 max-w-lg border rule bg-[var(--ground-raised)] p-6 bracket">
          <p className="text-lg font-bold">Connect to enter</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            The terminal is open to holders of {fmt(TERMINAL_GATE)} {TOKEN.symbol} or more. Signing
            is free and proves the wallet is yours.
          </p>
          <div className="mt-5">
            <ConnectButton />
            <ConnectError />
          </div>
        </div>
      </Shell>
    );
  }

  if (!account.canOpenTerminal) {
    const short = account.balanceKnown ? TERMINAL_GATE - account.balance : TERMINAL_GATE;
    return (
      <Shell>
        <div className="mt-8 max-w-lg border rule bg-[var(--ground-raised)] p-6">
          <p className="text-lg font-bold">Locked</p>
          {account.balanceKnown ? (
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              You hold <strong className="text-[var(--text)]">{fmt(account.balance)}</strong>{" "}
              {TOKEN.symbol}. You need {fmt(short)} more to open the terminal.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              No token mint is configured yet, so holdings can&apos;t be verified. Set{" "}
              <code className="font-mono text-xs">NEXT_PUBLIC_ATTENTION_MINT</code> to enable the
              gate.
            </p>
          )}
          <Link
            href="/#rewards"
            className="mt-5 inline-block border px-3 py-2 text-sm font-semibold rule hover:border-[var(--color-orange)]"
          >
            See eligibility
          </Link>
        </div>
      </Shell>
    );
  }

  const [feed, scannerCalls, leaderboard] = await Promise.all([
    getTerminalFeed(),
    loadScannerCalls(),
    getLeaderboard(),
  ]);
  return (
    <Shell>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="bg-[var(--color-orange)] px-2 py-1 text-xs font-bold text-white">
          {account.tier.name}
        </span>
        <span className="text-sm text-[var(--text-soft)]">
          {fmt(account.balance)} {TOKEN.symbol}
        </span>
        {feed.source === "manual" ? <span className="label">curated by the team</span> : null}
      </div>

      <div className="mt-8">
        <TerminalPanels feed={feed} scannerCalls={scannerCalls} leaderboard={leaderboard} />
      </div>
    </Shell>
  );
}
