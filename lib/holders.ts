import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN, isMintConfigured } from "./config";

/**
 * Full holder scan for the ATTENTION mint.
 *
 * Uses getParsedProgramAccounts filtered by mint, which walks EVERY token
 * account for the token. That is exactly what eligibility needs (every holder
 * ≥ threshold, not just the top 20), but it is a heavy call: it will not work
 * on the public RPC endpoint. Point SOLANA_RPC_URL at Helius/Triton/QuickNode
 * before using anything built on this.
 */

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export type Holder = { owner: string; balance: number };

export async function scanHolders(minBalance = 0): Promise<Holder[]> {
  if (!isMintConfigured()) {
    throw new Error("NEXT_PUBLIC_ATTENTION_MINT is not set");
  }
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl || rpcUrl.includes("api.mainnet-beta.solana.com")) {
    throw new Error(
      "Holder scans need a dedicated RPC (Helius/Triton/QuickNode) in SOLANA_RPC_URL — the public endpoint rejects getProgramAccounts at this size",
    );
  }

  const connection = new Connection(rpcUrl, "confirmed");
  const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
    filters: [
      { dataSize: 165 },
      { memcmp: { offset: 0, bytes: TOKEN.mint } },
    ],
  });

  // A wallet can hold several accounts for the same mint — sum per owner.
  const byOwner = new Map<string, number>();
  for (const { account } of accounts) {
    const parsed = (account.data as { parsed?: { info?: { owner?: string; tokenAmount?: { uiAmount: number | null } } } }).parsed;
    const owner = parsed?.info?.owner;
    const amount = parsed?.info?.tokenAmount?.uiAmount ?? 0;
    if (owner && amount > 0) {
      byOwner.set(owner, (byOwner.get(owner) ?? 0) + amount);
    }
  }

  return [...byOwner.entries()]
    .map(([owner, balance]) => ({ owner, balance }))
    .filter((holder) => holder.balance >= minBalance)
    .sort((a, b) => b.balance - a.balance);
}
