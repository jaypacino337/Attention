import { Connection, PublicKey } from "@solana/web3.js";
import { unstable_cache } from "next/cache";
import { TOKEN } from "./config";

/**
 * Real on-chain token stats, read straight from Solana (cheap single-account
 * reads, fine on any RPC). Cached 60s. Any failure → null and the UI shows "—".
 *
 * pump.fun BondingCurve layout (same as memcoinz lib/chain.ts curveProgress):
 * 8-byte discriminator, u64 virtual_token, virtual_sol, real_token, real_sol,
 * total_supply, bool complete.
 */
const PUMP = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const INITIAL_REAL_TOKENS = 793_100_000_000_000n;

export type ChainStats = {
  supply: number;
  burned: number;
  curve: { progress: number; complete: boolean; realSol: number; mcapSol: number | null } | null;
  at: string;
};

async function read(): Promise<ChainStats | null> {
  try {
    const conn = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
    const mint = new PublicKey(TOKEN.mint);
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), mint.toBuffer()], PUMP);
    const [supplyRes, acc] = await Promise.all([conn.getTokenSupply(mint), conn.getAccountInfo(pda)]);
    const supply = Number(supplyRes.value.uiAmountString ?? 0);
    let curve: ChainStats["curve"] = null;
    if (acc && acc.data.length >= 49) {
      const d = acc.data;
      const vToken = d.readBigUInt64LE(8);
      const vSol = d.readBigUInt64LE(16);
      const realToken = d.readBigUInt64LE(24);
      const realSol = d.readBigUInt64LE(32);
      const complete = d[48] === 1;
      const sold = INITIAL_REAL_TOKENS - (realToken > INITIAL_REAL_TOKENS ? INITIAL_REAL_TOKENS : realToken);
      curve = {
        complete,
        progress: complete ? 1 : Number((sold * 10_000n) / INITIAL_REAL_TOKENS) / 10_000,
        realSol: Number(realSol) / 1e9,
        // price in SOL per whole token × supply; only meaningful while on the curve
        mcapSol: !complete && vToken > 0n ? (Number(vSol) / 1e9 / (Number(vToken) / 10 ** TOKEN.decimals)) * supply : null,
      };
    }
    return { supply, burned: Math.max(0, TOKEN.supply - supply), curve, at: new Date().toISOString() };
  } catch {
    return null;
  }
}

export const getChainStats = unstable_cache(read, ["chain-stats"], { revalidate: 60 });
