"use client";

import { WALLET_ENABLED } from "@/lib/config";
import { useWallet } from "./wallet-context";

function short(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function ConnectButton({ className = "" }: { className?: string }) {
  const { account, status, connect, disconnect, hasProvider } = useWallet();

  // Pre-launch (no mint configured) the site carries no wallet UI at all.
  if (!WALLET_ENABLED) return null;

  if (account) {
    return (
      <button
        type="button"
        onClick={() => void disconnect()}
        className={`group inline-flex items-center gap-2 border px-3 py-2 text-sm font-semibold rule hover:border-[var(--color-orange)] ${className}`}
        title={account.wallet}
      >
        <span className="h-2 w-2 rounded-full bg-[var(--color-lime)]" />
        <span className="font-mono">{short(account.wallet)}</span>
        <span className="text-[var(--text-faint)] group-hover:text-[var(--color-orange)]">
          disconnect
        </span>
      </button>
    );
  }

  const busy = status === "connecting" || status === "signing";

  return (
    <button
      type="button"
      onClick={() => void connect()}
      disabled={busy}
      className={`inline-flex items-center gap-2 bg-[var(--color-orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-70 ${className}`}
    >
      {status === "signing" ? "Sign in wallet…" : busy ? "Connecting…" : "Connect wallet"}
      {!hasProvider && !busy ? <span className="sr-only">(no wallet detected)</span> : null}
    </button>
  );
}

/** Inline error slot — rendered where the action was taken, not as a toast. */
export function ConnectError() {
  const { error } = useWallet();
  if (!WALLET_ENABLED || !error) return null;
  return (
    <p className="mt-3 border-l-2 border-[var(--color-orange)] pl-3 text-sm text-[var(--text-soft)]">
      {error}
    </p>
  );
}
