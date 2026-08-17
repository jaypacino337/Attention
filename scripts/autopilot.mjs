#!/usr/bin/env node
/**
 * Attention autopilot — runs on YOUR machine, never on a server.
 *
 * One command does the whole epoch:
 *   1. CLAIM   pump.fun creator fees (signs locally via PumpPortal's
 *              local-transaction API — your key is never sent anywhere).
 *   2. SHEET   asks your site who is owed what for that revenue.
 *   3. AIRDROP sends the payable pool to every eligible holder.
 *
 * Setup (once):
 *   export SOLANA_RPC_URL="https://mainnet.helius-rpc.com/?api-key=..."
 *   export SITE_URL="https://attnmarkets.fun"
 *   export ADMIN_KEY="your-admin-key"
 *   # claim wallet = the pump.fun creator (dev) wallet's keypair file,
 *   # payout wallet = a separate low-balance wallet for sending airdrops.
 *
 * Run:
 *   node scripts/autopilot.mjs --claim ~/dev.json --pay ~/payer.json          # dry run
 *   node scripts/autopilot.mjs --claim ~/dev.json --pay ~/payer.json --send   # real
 *
 * No claim wallet? Claim manually on pump.fun, then skip straight to payout:
 *   node scripts/autopilot.mjs --pay ~/payer.json --revenue 12.5 --send
 *
 * Automate with cron (runs daily at 18:00, your machine must be on):
 *   0 18 * * *  cd /path/to/Attention && node scripts/autopilot.mjs --claim ~/dev.json --pay ~/payer.json --send >> autopilot.log 2>&1
 *
 * Safety rails: dry run by default; balance preflight; dust guard; a failed
 * recipient never stops the rest; the claim wallet is only ever used to claim,
 * the payout wallet only to pay.
 */
import fs from "node:fs";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

// ---------- args ----------
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(`--${name}`);

const claimPath = flag("claim");
const payPath = flag("pay");
const revenueOverride = flag("revenue") ? Number(flag("revenue")) : undefined;
const send = has("send");

const SITE_URL = process.env.SITE_URL ?? "https://attnmarkets.fun";
const ADMIN_KEY = process.env.ADMIN_KEY;
const RPC_URL = process.env.SOLANA_RPC_URL;
const MIN_CLAIM_SOL = Number(flag("min-claim") ?? 0.05); // skip epochs not worth the fees
const MIN_PAYOUT_SOL = 0.001; // dust guard per recipient

if (!payPath) {
  console.error("usage: node scripts/autopilot.mjs [--claim dev.json] --pay payer.json [--revenue N] [--send]");
  process.exit(1);
}
if (!RPC_URL) {
  console.error("Set SOLANA_RPC_URL (your Helius URL).");
  process.exit(1);
}
if (!ADMIN_KEY) {
  console.error("Set ADMIN_KEY (same value as on your host).");
  process.exit(1);
}
if (!claimPath && revenueOverride === undefined) {
  console.error("Pass --claim <dev-keypair.json> to auto-claim, or --revenue <SOL> if you claimed manually.");
  process.exit(1);
}

function decodeBase58(text) {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = [0];
  for (const char of text.trim()) {
    const value = ALPHABET.indexOf(char);
    if (value < 0) throw new Error("not base58");
    let carry = value;
    for (let i = 0; i < bytes.length; i += 1) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  return Uint8Array.from(bytes.reverse());
}

/** Reads a keypair file: either Phantom's exported base58 string or a JSON byte array. */
const loadKeypair = (path) => {
  const raw = fs.readFileSync(path, "utf8").trim();
  if (raw.startsWith("[")) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
  return Keypair.fromSecretKey(decodeBase58(raw));
};

const connection = new Connection(RPC_URL, "confirmed");
const sol = (lamports) => lamports / LAMPORTS_PER_SOL;
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

// ---------- 1. claim creator fees ----------
let revenue = revenueOverride ?? 0;

if (claimPath) {
  const claimer = loadKeypair(claimPath);
  log(`claim wallet: ${claimer.publicKey.toBase58()}`);
  const before = await connection.getBalance(claimer.publicKey);

  // PumpPortal's local-transaction API returns an UNSIGNED transaction; we
  // sign it here, locally. The private key never leaves this process.
  const response = await fetch("https://pumpportal.fun/api/trade-local", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      publicKey: claimer.publicKey.toBase58(),
      action: "collectCreatorFee",
      priorityFee: 0.000_1,
    }),
  });

  if (!response.ok) {
    console.error(`Claim transaction build failed (${response.status}): ${await response.text()}`);
    console.error("Claim manually on pump.fun, then rerun with --revenue <claimed SOL>.");
    process.exit(1);
  }

  const tx = VersionedTransaction.deserialize(new Uint8Array(await response.arrayBuffer()));
  tx.sign([claimer]);

  if (!send) {
    log("dry run: claim transaction built and signed locally, NOT sent (pass --send)");
  } else {
    const signature = await connection.sendTransaction(tx);
    await connection.confirmTransaction(signature, "confirmed");
    log(`claimed — tx ${signature}`);
    const after = await connection.getBalance(claimer.publicKey);
    revenue = Math.max(0, sol(after - before));
    log(`claimed amount: ${revenue.toFixed(4)} SOL`);
    if (revenue < MIN_CLAIM_SOL) {
      log(`below --min-claim (${MIN_CLAIM_SOL} SOL) — stopping here, fees roll to next run`);
      process.exit(0);
    }
  }
}

if (!send && revenue === 0) {
  // Dry run with no measured claim: use the override or a placeholder so the
  // sheet preview still renders.
  revenue = revenueOverride ?? 1;
  log(`dry run: previewing sheet with revenue ${revenue} SOL`);
}

// ---------- 2. fetch the payout sheet from the site ----------
const sheetResponse = await fetch(
  `${SITE_URL}/api/epoch?revenue=${encodeURIComponent(revenue)}`,
  { headers: { "x-admin-key": ADMIN_KEY } },
);
const sheet = await sheetResponse.json();
if (!sheetResponse.ok) {
  console.error(`Sheet failed (${sheetResponse.status}): ${sheet.error ?? "unknown"}`);
  process.exit(1);
}
log(`sheet: ${sheet.eligibleHolders} eligible holders, revenue ${revenue} SOL`);

// Only the holder-proportional pool is auto-payable; callout/social pools
// need scores attached and are reported unclaimed by the sheet.
const payouts = (sheet.payouts ?? [])
  .map((p) => ({ wallet: p.wallet, sol: p.amounts?.fomo ?? 0 }))
  .filter((p) => p.sol >= MIN_PAYOUT_SOL);
const totalPay = payouts.reduce((sum, p) => sum + p.sol, 0);
log(`payable now (holder pool): ${payouts.length} wallets, ${totalPay.toFixed(4)} SOL`);

// ---------- 3. airdrop ----------
const payer = loadKeypair(payPath);
log(`payout wallet: ${payer.publicKey.toBase58()}`);
const payerBalance = sol(await connection.getBalance(payer.publicKey));
log(`payout wallet balance: ${payerBalance.toFixed(4)} SOL`);

if (!send) {
  for (const p of payouts.slice(0, 10)) {
    log(`would send ${p.sol.toFixed(6)} SOL -> ${p.wallet}`);
  }
  if (payouts.length > 10) log(`…and ${payouts.length - 10} more`);
  log("dry run complete — pass --send to claim and pay for real");
  process.exit(0);
}

if (payerBalance < totalPay * 1.01) {
  console.error(
    `Payout wallet holds ${payerBalance.toFixed(4)} SOL but the sheet needs ~${totalPay.toFixed(4)}. ` +
      `Top it up from the claim wallet first (a normal transfer in your wallet app). No transfers made.`,
  );
  process.exit(1);
}

let sent = 0;
for (const p of payouts) {
  try {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: new PublicKey(p.wallet),
        lamports: Math.floor(p.sol * LAMPORTS_PER_SOL),
      }),
    );
    const signature = await connection.sendTransaction(tx, [payer]);
    await connection.confirmTransaction(signature, "confirmed");
    sent += 1;
    log(`sent ${p.sol.toFixed(6)} SOL -> ${p.wallet}  ${signature}`);
  } catch (error) {
    console.error(`FAILED -> ${p.wallet}: ${error.message}`);
  }
}
log(`airdrop complete: ${sent}/${payouts.length} confirmed`);
