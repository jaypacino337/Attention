/**
 * PORTED verbatim from memcoinz .claude/skills/launchpad-site/preset-seats/lib/chain.ts.
 * Handles Token-2022, which $ATTENTION is.
 */
import { Connection, PublicKey } from "@solana/web3.js";

const TOKEN = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ATA = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export const connection = () => new Connection(process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com", "confirmed");

/**
 * Whole-token balance of each wallet's associated token account for `mint`.
 * - account missing → 0 (no ATA = holds nothing there)
 * - RPC failure for a chunk → those wallets are left OUT of the map, so the
 *   sweep keeps their seats (never free a seat on a failed read).
 */
export async function ataBalances(conn: Connection, mint: string, wallets: string[]): Promise<Map<string, number>> {
  const mintKey = new PublicKey(mint);
  const info = await conn.getAccountInfo(mintKey);
  if (!info) throw new Error("Mint not found on this RPC");
  const program = info.owner.equals(TOKEN_2022) ? TOKEN_2022 : TOKEN;
  const decimals = info.data[44];
  const out = new Map<string, number>();
  for (let i = 0; i < wallets.length; i += 100) {
    const chunk = wallets.slice(i, i + 100);
    const atas = chunk.map((w) => PublicKey.findProgramAddressSync([new PublicKey(w).toBuffer(), program.toBuffer(), mintKey.toBuffer()], ATA)[0]);
    try {
      const accounts = await conn.getMultipleAccountsInfo(atas);
      accounts.forEach((a, j) => {
        const raw = a && a.data.length >= 72 ? a.data.readBigUInt64LE(64) : 0n;
        out.set(chunk[j], Number(raw / 10n ** BigInt(decimals)));
      });
    } catch {
      /* unknown → keep seats */
    }
  }
  return out;
}

const PUMP = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
/** pump.fun starts every curve with 793.1M real tokens for sale (6 decimals). */
const INITIAL_REAL_TOKENS = 793_100_000_000_000n;

/**
 * Bonding-curve progress read from chain: pump.fun BondingCurve account
 * (8-byte discriminator, then u64 virtual_token, virtual_sol, real_token,
 * real_sol, total_supply, then bool complete). null when unreadable.
 */
export async function curveProgress(conn: Connection, mints: string[]): Promise<Map<string, { progress: number; complete: boolean; realSol: number } | null>> {
  const out = new Map<string, { progress: number; complete: boolean; realSol: number } | null>();
  for (let i = 0; i < mints.length; i += 100) {
    const chunk = mints.slice(i, i + 100);
    const pdas = chunk.map((m) => PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), new PublicKey(m).toBuffer()], PUMP)[0]);
    const accs = await conn.getMultipleAccountsInfo(pdas).catch(() => chunk.map(() => null));
    accs.forEach((a, j) => {
      if (!a || a.data.length < 49) return out.set(chunk[j], null);
      const realToken = a.data.readBigUInt64LE(24);
      const realSol = a.data.readBigUInt64LE(32);
      const complete = a.data[48] === 1;
      const sold = INITIAL_REAL_TOKENS - (realToken > INITIAL_REAL_TOKENS ? INITIAL_REAL_TOKENS : realToken);
      out.set(chunk[j], { progress: complete ? 1 : Number((sold * 10_000n) / INITIAL_REAL_TOKENS) / 10_000, complete, realSol: Number(realSol) / 1e9 });
    });
  }
  return out;
}
