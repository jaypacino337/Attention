"use client";

import Link from "next/link";
import { WALLET_ENABLED } from "@/lib/config";
import { useWallet } from "./wallet-context";
import { ConnectButton, ConnectError } from "./connect-button";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Live eligibility readout.
 *
 * This is the honest-state component: it says "connect", "preview mode",
 * "not enough" or "you're in", and never guesses a balance it could not read.
 */
export function EligibilityPanel({
  eligibleAt,
  fullAt,
}: {
  eligibleAt: number;
  fullAt: number;
}) {
  const { account, status } = useWallet();

  if (!WALLET_ENABLED) {
    return (
      <div className="bracket border rule bg-[var(--ground-raised)] p-6">
        <p className="label">Automatic airdrops</p>
        <p className="mt-3 text-lg font-bold">Hold. That&apos;s it.</p>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          No connect, no signup, no claiming. The protocol scans every holder on-chain — hold{" "}
          {fmt(eligibleAt)}+ $ATTENTION and rewards are airdropped straight to your wallet.{" "}
          {fmt(fullAt)} earns at double weight.
        </p>
        <p className="mt-3 border-l-2 border-[var(--color-orange)] pl-3 text-sm text-[var(--text-soft)]">
          If anything ever asks you to connect a wallet or sign to &quot;claim rewards&quot; from
          us, it&apos;s a scam. Payouts find you.
        </p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bracket border rule bg-[var(--ground-raised)] p-6">
        <p className="label">Your status</p>
        <p className="mt-3 text-lg font-bold">Connect to check eligibility</p>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          Signing is free — no transaction, no approval. We read your {fmt(eligibleAt)}+ ATTENTION
          balance on-chain to decide which pools you qualify for.
        </p>
        <div className="mt-5">
          <ConnectButton />
          <ConnectError />
        </div>
      </div>
    );
  }

  if (!account.balanceKnown) {
    return (
      <div className="bracket border rule bg-[var(--ground-raised)] p-6">
        <p className="label">Your status</p>
        <p className="mt-3 text-lg font-bold">Preview mode</p>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          Wallet verified, but no token mint is configured yet, so balances can&apos;t be read.
          Set <code className="font-mono text-xs">NEXT_PUBLIC_ATTENTION_MINT</code> to go live.
        </p>
      </div>
    );
  }

  const target = account.balance >= fullAt ? fullAt : eligibleAt;
  const progress = Math.min(100, (account.balance / target) * 100);

  return (
    <div className="bracket border rule bg-[var(--ground-raised)] p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="label">Your status</p>
        <p className="label">{status === "ready" ? "live" : status}</p>
      </div>

      <p className="mt-3 font-mono text-3xl font-bold tracking-tight">{fmt(account.balance)}</p>
      <p className="text-sm text-[var(--text-soft)]">ATTENTION held</p>

      <div className="mt-5 h-1.5 w-full bg-[var(--line)]">
        <div
          className="h-full bg-[var(--color-orange)]"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress to next tier"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`px-2 py-1 text-xs font-bold ${
            account.eligible
              ? "bg-[var(--color-orange)] text-white"
              : "border rule text-[var(--text-soft)]"
          }`}
        >
          {account.tier.name}
        </span>
        {account.eligible ? (
          <span className="text-sm text-[var(--text-soft)]">
            Earning at {account.tier.weight}x weight
          </span>
        ) : (
          <span className="text-sm text-[var(--text-soft)]">
            {fmt(eligibleAt - account.balance)} more to qualify
          </span>
        )}
      </div>

      {account.toNextTier ? (
        <p className="mt-3 text-sm text-[var(--text-soft)]">
          {fmt(account.toNextTier.needed)} more unlocks{" "}
          <strong className="text-[var(--text)]">{account.toNextTier.tier.name}</strong>.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/account"
          className="border px-3 py-2 text-sm font-semibold rule hover:border-[var(--color-orange)]"
        >
          Account & X link
        </Link>
        {account.canOpenTerminal ? (
          <Link
            href="/terminal"
            className="bg-[var(--color-orange)] px-3 py-2 text-sm font-bold text-white"
          >
            Open terminal
          </Link>
        ) : null}
      </div>
    </div>
  );
}
