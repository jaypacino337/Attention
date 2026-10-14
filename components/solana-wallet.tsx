"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { VersionedTransaction } from "@solana/web3.js";

/**
 * Plain wallet connection for the Send and Swap tools: connect, read the
 * address, sign a transaction. No sign-in, no session, nothing stored.
 * Works with any injected Solana wallet (Phantom, Solflare, Backpack…).
 */
type Provider = {
  publicKey?: { toString(): string } | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } } | void>;
  disconnect(): Promise<void>;
  signTransaction(tx: VersionedTransaction): Promise<VersionedTransaction>;
  on?(event: string, cb: (...args: unknown[]) => void): void;
  off?(event: string, cb: (...args: unknown[]) => void): void;
};

function detect(): Provider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { phantom?: { solana?: Provider }; solana?: Provider; solflare?: Provider; backpack?: Provider };
  return w.phantom?.solana ?? w.solana ?? w.solflare ?? w.backpack ?? null;
}

type State = {
  address: string | null;
  connecting: boolean;
  error: string | null;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(tx: VersionedTransaction): Promise<VersionedTransaction>;
};

const Ctx = createContext<State | null>(null);

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // reconnect silently if the wallet already trusts this site
    const t = window.setTimeout(() => {
      const p = detect();
      p?.connect({ onlyIfTrusted: true })
        .then(() => p.publicKey && setAddress(p.publicKey.toString()))
        .catch(() => {});
      const onChange = (pk: unknown) => setAddress(pk ? String(pk) : null);
      p?.on?.("accountChanged", onChange);
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    const p = detect();
    if (!p) {
      setError("No Solana wallet found. Install Phantom, Solflare or Backpack, then reload.");
      return;
    }
    setConnecting(true);
    try {
      await p.connect();
      setAddress(p.publicKey?.toString() ?? null);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (!/reject|denied|cancel/i.test(m)) setError(m);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await detect()?.disconnect();
    } catch {}
    setAddress(null);
  }, []);

  const signTransaction = useCallback(async (tx: VersionedTransaction) => {
    const p = detect();
    if (!p) throw new Error("Wallet not connected.");
    return p.signTransaction(tx);
  }, []);

  const value = useMemo(() => ({ address, connecting, error, connect, disconnect, signTransaction }), [address, connecting, error, connect, disconnect, signTransaction]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSolanaWallet() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSolanaWallet must be inside SolanaWalletProvider");
  return c;
}

export const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

export function WalletButton({ className = "" }: { className?: string }) {
  const { address, connecting, connect, disconnect } = useSolanaWallet();
  if (address)
    return (
      <button type="button" onClick={() => void disconnect()} title="Disconnect" className={`group inline-flex items-center gap-2 border rule px-3 py-1.5 text-xs font-bold hover:border-[var(--color-orange)] ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-orange)]" />
        <span className="font-mono">{shortAddr(address)}</span>
      </button>
    );
  return (
    <button type="button" onClick={() => void connect()} disabled={connecting} className={`btn-primary !px-3 !py-1.5 text-xs ${className}`}>
      {connecting ? "Connecting…" : "Connect"}
    </button>
  );
}
