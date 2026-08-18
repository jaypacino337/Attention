import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN, isMintConfigured } from "./config";

/**
 * Server-side Solana reads.
 *
 * The RPC url is server-only on purpose — a Helius/Triton key in
 * NEXT_PUBLIC_* would be handed to every visitor. The browser never talks to
 * an RPC directly; it asks our API, which does the lookup.
 */
const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

let connection: Connection | null = null;

function rpc(): Connection {
  if (!connection) {
    connection = new Connection(RPC_URL, "confirmed");
  }
  return connection;
}

export type BalanceResult =
  | { configured: false; balance: 0; reason: string }
  | { configured: true; balance: number };

/**
 * Total ATTENTION held by `owner`, in whole tokens.
 *
 * Sums every token account for the mint under that owner — a wallet can hold
 * the same mint across multiple accounts (ATA plus any legacy account), and
 * reading only the ATA would under-count and wrongly deny rewards.
 */
export async function getAttentionBalance(owner: string): Promise<BalanceResult> {
  if (!isMintConfigured()) {
    return {
      configured: false,
      balance: 0,
      reason: "NEXT_PUBLIC_ATTENTION_MINT is not set",
    };
  }

  let ownerKey: PublicKey;
  let mintKey: PublicKey;
  try {
    ownerKey = new PublicKey(owner);
    mintKey = new PublicKey(TOKEN.mint);
  } catch {
    return { configured: false, balance: 0, reason: "Invalid wallet or mint address" };
  }

  try {
    const accounts = await rpc().getParsedTokenAccountsByOwner(ownerKey, { mint: mintKey });
    const balance = accounts.value.reduce((sum, { account }) => {
      const parsed = account.data.parsed as {
        info?: { tokenAmount?: { uiAmount: number | null } };
      };
      return sum + (parsed.info?.tokenAmount?.uiAmount ?? 0);
    }, 0);
    return { configured: true, balance };
  } catch {
    // RPC down or rate limited: report the balance as unknown rather than
    // crashing the request or inventing a zero.
    return { configured: false, balance: 0, reason: "Balance read failed — RPC unreachable" };
  }
}

/** Validate a base58 address without throwing. */
export function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function shortAddress(address: string, size = 4): string {
  if (address.length <= size * 2 + 1) return address;
  return `${address.slice(0, size)}…${address.slice(-size)}`;
}
