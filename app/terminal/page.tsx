import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { ConnectButton, ConnectError } from "@/components/connect-button";
import { TerminalPanels } from "@/components/terminal-panels";
import { loadAccount } from "@/lib/account";
import { FULL_TIER, TERMINAL_GATE, TOKEN, WALLET_ENABLED } from "@/lib/config";
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
      <p className="label">Token-gated · {fmt(TERMINAL_GATE)} {TOKEN.symbol}</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
        Attention <span className="serif-italic font-normal">Terminal</span>
      </h1>
      {children}
    </section>
  );
}

export default async function TerminalPage() {
  // Pre-launch: no mint, no wallet UI — the terminal is a preview, not a gate.
  if (!WALLET_ENABLED) {
    return (
      <Shell>
        <div className="mt-8 max-w-lg border rule bg-[var(--ground-raised)] p-6 bracket">
          <p className="text-lg font-bold">Opens at launch</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            The terminal goes live with the token. Holders of {fmt(TERMINAL_GATE)} {TOKEN.symbol}{" "}
            get in; {fmt(FULL_TIER)} unlocks the operator panels — top wallets, meta rotation and
            chain flow.
          </p>
          <Link
            href="/#rewards"
            className="mt-5 inline-block border px-3 py-2 text-sm font-semibold rule hover:border-[var(--color-orange)]"
          >
            See the tiers
          </Link>
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
            See the tiers
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
  const isOperator = account.balance >= FULL_TIER;

  return (
    <Shell>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="bg-[var(--color-orange)] px-2 py-1 text-xs font-bold text-white">
          {account.tier.name}
        </span>
        <span className="text-sm text-[var(--text-soft)]">
          {fmt(account.balance)} {TOKEN.symbol} · {account.tier.weight}x weight
        </span>
        {feed.source === "sample" ? (
          <span className="border border-dashed rule px-2 py-1 text-xs font-semibold text-[var(--text-soft)]">
            sample data — live feeds not connected
          </span>
        ) : feed.source === "manual" ? (
          <span className="border border-dashed rule px-2 py-1 text-xs font-semibold text-[var(--text-soft)]">
            curated by the team
          </span>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <TerminalPanels
          feed={feed}
          scannerCalls={scannerCalls}
          leaderboard={leaderboard}
          isOperator={isOperator}
          operatorMin={FULL_TIER}
        />
        <aside className="space-y-6">
          <AdSlot slot="terminal" label="Terminal sidebar" size="400 × 300" />
        </aside>
      </div>
    </Shell>
  );
}
