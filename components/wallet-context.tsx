"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Wallet connection + sign-in.
 *
 * Talks to the injected provider directly instead of pulling in the full
 * wallet-adapter stack: this covers Phantom, Solflare and Backpack, which is
 * the overwhelming majority of Solana users, without shipping a megabyte of
 * adapter code to every visitor.
 */

type SolanaProvider = {
  isPhantom?: boolean;
  publicKey?: { toString(): string } | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array }>;
};

declare global {
  interface Window {
    solana?: SolanaProvider;
    solflare?: SolanaProvider;
    backpack?: SolanaProvider;
  }
}

export type AccountSnapshot = {
  wallet: string;
  balance: number;
  balanceKnown: boolean;
  tier: { id: string; name: string; min: number; weight: number; perks: readonly string[] };
  eligible: boolean;
  canOpenTerminal: boolean;
  toNextTier: { tier: { name: string; min: number }; needed: number } | null;
  xLink: { handle: string; verified: boolean } | null;
  thresholds: { eligible: number; terminal: number };
};

type Status = "idle" | "connecting" | "signing" | "ready";

type WalletState = {
  account: AccountSnapshot | null;
  status: Status;
  error: string | null;
  hasProvider: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

function detectProvider(): SolanaProvider | null {
  if (typeof window === "undefined") return null;
  return window.solana ?? window.solflare ?? window.backpack ?? null;
}

/** base58 encode — needed to send the signature in the format the API expects. */
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function toBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  // Leading zero bytes are significant in base58 and encode as '1'.
  let out = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) out += "1";
  for (let i = digits.length - 1; i >= 0; i -= 1) out += ALPHABET[digits[i]];
  return out;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(true);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/me", { cache: "no-store" });
    const data = await response.json();
    setAccount(data.authenticated ? (data.account as AccountSnapshot) : null);
    setStatus(data.authenticated ? "ready" : "idle");
  }, []);

  // Restore an existing session on load, and only then check for a wallet
  // extension — checking too early races the extension's own injection.
  useEffect(() => {
    void refresh();
    const timer = window.setTimeout(() => setHasProvider(detectProvider() !== null), 600);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const connect = useCallback(async () => {
    setError(null);
    const provider = detectProvider();
    if (!provider) {
      setHasProvider(false);
      setError("No Solana wallet found. Install Phantom, Solflare or Backpack.");
      return;
    }

    try {
      setStatus("connecting");
      const { publicKey } = await provider.connect();
      const wallet = publicKey.toString();

      setStatus("signing");
      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const challengeData = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challengeData.error ?? "Could not start sign-in");

      const encoded = new TextEncoder().encode(challengeData.message as string);
      const { signature } = await provider.signMessage(encoded, "utf8");

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wallet,
          challenge: challengeData.challenge,
          signature: toBase58(signature),
        }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyData.error ?? "Verification failed");

      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Wallet connection failed";
      // A user closing the wallet popup is a choice, not an error to shout about.
      setError(/user rejected|user denied/i.test(message) ? null : message);
      setStatus("idle");
    }
  }, [refresh]);

  const disconnect = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    try {
      await detectProvider()?.disconnect();
    } catch {
      // The extension may already be disconnected; our session is gone either way.
    }
    setAccount(null);
    setStatus("idle");
  }, []);

  const value = useMemo(
    () => ({ account, status, error, hasProvider, connect, disconnect, refresh }),
    [account, status, error, hasProvider, connect, disconnect, refresh],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside <WalletProvider>");
  return context;
}
