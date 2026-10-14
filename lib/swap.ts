import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getConnection } from "./solana";

/**
 * "Swap to someone": a Jupiter swap paid by the sender whose output lands in
 * the recipient's token account. On-chain it reads as the sender's own swap.
 * The server only builds the unsigned transaction; the sender's wallet signs it.
 */

// With a Jupiter API key the paid endpoint is used (higher limits); without one, the free lite API.
const JUP_KEY = process.env.JUPITER_API_KEY ?? "";
const JUP = process.env.JUPITER_API_URL ?? (JUP_KEY ? "https://api.jup.ag/swap/v1" : "https://lite-api.jup.ag/swap/v1");

/** Jupiter call with a short retry on rate limits and brief outages. */
async function jup(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  let last = { ok: false, status: 0, body: {} as Record<string, unknown> };
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    try {
      const r = await fetch(`${JUP}${path}`, {
        ...init,
        cache: "no-store",
        headers: { ...(init?.headers ?? {}), ...(JUP_KEY ? { "x-api-key": JUP_KEY } : {}) },
      });
      last = { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
      if (r.status !== 429 && r.status < 500) return last;
    } catch {
      last = { ok: false, status: 0, body: {} };
    }
  }
  return last;
}
const busy = (status: number) => status === 0 || status === 429 || status >= 500;
export const WSOL = "So11111111111111111111111111111111111111112";
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const TOKEN_PROGRAMS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]);

export class SwapError extends Error {}

export async function mintInfo(mint: string): Promise<{ decimals: number; program: PublicKey }> {
  if (mint === WSOL) return { decimals: 9, program: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") };
  let key: PublicKey;
  try {
    key = new PublicKey(mint);
  } catch {
    throw new SwapError("That is not a valid token mint address.");
  }
  const acct = await getConnection().getParsedAccountInfo(key);
  const owner = acct.value?.owner.toBase58();
  const data = acct.value?.data as { parsed?: { type?: string; info?: { decimals?: number } } } | undefined;
  if (!owner || !TOKEN_PROGRAMS.has(owner) || data?.parsed?.type !== "mint") throw new SwapError("That address is not a token mint.");
  return { decimals: data.parsed.info?.decimals ?? 0, program: new PublicKey(owner) };
}

export function toBaseUnits(ui: string, decimals: number): bigint {
  const m = ui.trim().match(/^(\d*)(?:\.(\d*))?$/);
  if (!m || (!m[1] && !m[2])) throw new SwapError("Enter an amount.");
  const frac = (m[2] ?? "").slice(0, decimals).padEnd(decimals, "0");
  const v = BigInt(m[1] || "0") * 10n ** BigInt(decimals) + BigInt(frac || "0");
  if (v <= 0n) throw new SwapError("Enter an amount above zero.");
  return v;
}

export async function quote(inputMint: string, outputMint: string, amount: bigint, slippageBps: number) {
  if (inputMint === outputMint) throw new SwapError("Pick two different tokens.");
  const r = await jup(`/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`);
  if (busy(r.status)) throw new SwapError("Jupiter is busy right now. Try again in a few seconds.");
  if (!r.ok || !r.body.outAmount) throw new SwapError(typeof r.body.error === "string" ? r.body.error : "No route found for that pair right now.");
  return r.body as unknown as { inAmount: string; outAmount: string; otherAmountThreshold: string; priceImpactPct: string; routePlan: { swapInfo: { label: string } }[] };
}

type JupIx = { programId: string; accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[]; data: string };
const toIx = (ix: JupIx) =>
  new TransactionInstruction({
    programId: new PublicKey(ix.programId),
    keys: ix.accounts.map((a) => ({ pubkey: new PublicKey(a.pubkey), isSigner: a.isSigner, isWritable: a.isWritable })),
    data: Buffer.from(ix.data, "base64"),
  });

function ata(owner: PublicKey, mint: PublicKey, program: PublicKey) {
  return PublicKey.findProgramAddressSync([owner.toBuffer(), program.toBuffer(), mint.toBuffer()], ATA_PROGRAM)[0];
}

/** Create the recipient's token account if missing (paid by the sender). */
function createAtaIdempotent(payer: PublicKey, account: PublicKey, owner: PublicKey, mint: PublicKey, program: PublicKey) {
  return new TransactionInstruction({
    programId: ATA_PROGRAM,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
      { pubkey: program, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]),
  });
}

export async function buildSwapToTx(opts: { user: string; recipient: string; inputMint: string; outputMint: string; amount: bigint; slippageBps: number }) {
  if (opts.outputMint === WSOL) throw new SwapError("To send SOL privately, use Send.");
  let user: PublicKey, recipient: PublicKey;
  try {
    user = new PublicKey(opts.user);
    recipient = new PublicKey(opts.recipient);
  } catch {
    throw new SwapError("That recipient is not a valid Solana address.");
  }
  if (!PublicKey.isOnCurve(recipient.toBytes())) throw new SwapError("Send to a wallet address, not a program or token account.");
  const out = await mintInfo(opts.outputMint);
  const outMint = new PublicKey(opts.outputMint);
  const destination = ata(recipient, outMint, out.program);

  const q = await quote(opts.inputMint, opts.outputMint, opts.amount, opts.slippageBps);
  const r = await jup(`/swap-instructions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: q,
      userPublicKey: user.toBase58(),
      destinationTokenAccount: destination.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 2_000_000, priorityLevel: "high" } },
    }),
  });
  if (busy(r.status)) throw new SwapError("Jupiter is busy right now. Try again in a few seconds.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = r.body as any;
  if (!r.ok || !body.swapInstruction) throw new SwapError(body.error ?? "Jupiter could not build this swap.");

  const connection = getConnection();
  const altKeys: string[] = body.addressLookupTableAddresses ?? [];
  const altInfos = altKeys.length ? await connection.getMultipleAccountsInfo(altKeys.map((k) => new PublicKey(k))) : [];
  const alts = altInfos.flatMap((info, i) =>
    info ? [new AddressLookupTableAccount({ key: new PublicKey(altKeys[i]), state: AddressLookupTableAccount.deserialize(info.data) })] : [],
  );

  const budget: JupIx[] = body.computeBudgetInstructions ?? [];
  const instructions = [
    ...(budget.length ? budget.map(toIx) : [ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 })]),
    createAtaIdempotent(user, destination, recipient, outMint, out.program),
    ...((body.otherInstructions ?? []) as JupIx[]).map(toIx),
    ...((body.setupInstructions ?? []) as JupIx[]).map(toIx),
    toIx(body.swapInstruction),
    ...(body.cleanupInstruction ? [toIx(body.cleanupInstruction)] : []),
  ];
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({ payerKey: user, recentBlockhash: blockhash, instructions }).compileToV0Message(alts);
  const tx = new VersionedTransaction(message);

  const sim = await connection.simulateTransaction(tx, { sigVerify: false, replaceRecentBlockhash: true });
  return {
    tx: Buffer.from(tx.serialize()).toString("base64"),
    lastValidBlockHeight,
    quote: q,
    outDecimals: out.decimals,
    destination: destination.toBase58(),
    simulation: sim.value.err ? { ok: false, error: explainSim(sim.value.err, sim.value.logs ?? []) } : { ok: true },
  };
}

function explainSim(err: unknown, logs: string[]): string {
  const text = JSON.stringify(err) + logs.join("\n");
  if (/insufficient lamports|InsufficientFunds|0x1\b|insufficient funds/i.test(text)) return "Not enough balance to cover the swap and network fees.";
  if (/AccountNotFound/.test(text)) return "Your wallet has no balance on mainnet yet.";
  if (/slippage|0x1771/i.test(text)) return "Price moved past your slippage. Try again or raise slippage.";
  return "The swap would fail right now. Try a smaller amount or another pair.";
}
