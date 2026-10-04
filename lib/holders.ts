import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN, isMintConfigured } from "./config";

/**
 * Full holder scan for the $ATTENTION mint (read-only, for the leaderboard).
 * Detects the token program like memcoinz snapshot.ts: $ATTENTION is
 * Token-2022, whose accounts are larger than 165 bytes, so the old
 * legacy-program/dataSize scan found nobody. Payout snapshots are taken by the
 * worker (memcoinz /snapshot), not here.
 *
 * Heavy call: needs a dedicated RPC in SOLANA_RPC_URL.
 */
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export type Holder = { owner: string; balance: number };

export async function scanHolders(minBalance = 0): Promise<Holder[]> {
  if (!isMintConfigured()) throw new Error("NEXT_PUBLIC_ATTENTION_MINT is not set");
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl || rpcUrl.includes("api.mainnet-beta.solana.com")) {
    throw new Error("Holder scans need a dedicated RPC (Helius/Triton/QuickNode) in SOLANA_RPC_URL");
  }

  const connection = new Connection(rpcUrl, "confirmed");
  const mint = new PublicKey(TOKEN.mint);
  const info = await connection.getAccountInfo(mint);
  if (!info) throw new Error("Mint not found on this RPC");
  const legacy = info.owner.equals(TOKEN_PROGRAM);
  const accounts = await connection.getParsedProgramAccounts(info.owner, {
    filters: [...(legacy ? [{ dataSize: 165 }] : []), { memcmp: { offset: 0, bytes: TOKEN.mint } }],
  });

  // A wallet can hold several accounts for the same mint: sum per owner.
  const byOwner = new Map<string, number>();
  for (const { account } of accounts) {
    const parsed = (account.data as { parsed?: { info?: { owner?: string; tokenAmount?: { uiAmount: number | null } } } }).parsed;
    const owner = parsed?.info?.owner;
    const amount = parsed?.info?.tokenAmount?.uiAmount ?? 0;
    if (owner && amount > 0) byOwner.set(owner, (byOwner.get(owner) ?? 0) + amount);
  }

  return [...byOwner.entries()]
    .map(([owner, balance]) => ({ owner, balance }))
    .filter((holder) => holder.balance >= minBalance)
    .sort((a, b) => b.balance - a.balance);
}
