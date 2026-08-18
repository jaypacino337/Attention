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
 * Automate hourly with cron (machine must be on):
 *   0 * * * *  cd /path/to/Attention && node scripts/autopilot.mjs --claim dev.txt --send >> autopilot.log 2>&1
 *
 * Diamond-hands rules (state kept locally in holders-state.json):
 *   - sell >50% of your peak balance -> ineligible until rebuilt (--sell-limit)
 *   - each consecutive epoch held -> +10% weight, capped at 2x
 *   - callout credits in callouts.json ({"WALLET": count}) -> +25% each, capped at 2x
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
/** Sold more than this fraction of your peak balance -> ineligible until you rebuild. */
const SELL_LIMIT = Number(flag("sell-limit") ?? 0.5);
/** Per-epoch holding-streak bonus and its cap (0.1 -> +10%/epoch, max 2x). */
const STREAK_BONUS = 0.1;
const STREAK_CAP = 2.0;
/** Per-callout bonus and its cap (0.25 -> +25%/callout, max 2x). */
const CALLOUT_BONUS = 0.25;
const CALLOUT_CAP = 2.0;
const statePath = flag("state") ?? "holders-state.json";
const calloutsPath = flag("callouts") ?? "callouts.json";

const SITE_URL = process.env.SITE_URL ?? "https://attnmarkets.fun";
const ADMIN_KEY = process.env.ADMIN_KEY;
const RPC_URL = process.env.SOLANA_RPC_URL;
const MIN_CLAIM_SOL = Number(flag("min-claim") ?? 0.05); // skip epochs not worth the fees
const MIN_PAYOUT_SOL = 0.001; // dust guard per recipient

// --pay is optional: with only --claim, the dev wallet claims AND pays.
if (!payPath && !claimPath) {
  console.error("usage: node scripts/autopilot.mjs --claim dev.txt [--pay payer.txt] [--revenue N] [--send]");
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
  console.error("Pass --claim <dev.txt> to auto-claim, or --revenue <SOL> after a manual claim.");
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

// ---------- diamond-hands engine (state lives on THIS machine) ----------
// Rules, in plain words:
//   SELL PENALTY  sold more than SELL_LIMIT (default 50%) of your peak
//                 balance -> ineligible until you rebuild above that line.
//   HOLD STREAK   every consecutive epoch you hold (>=90% of last balance)
//                 adds +10% weight, capped at 2x.
//   CALLOUTS      each callout you credit in callouts.json adds +25%,
//                 capped at 2x. { "WALLET_ADDRESS": 3, ... }
// Weight = balance x streak x callouts. State updates only on --send.
const holders = sheet.holders ?? [];
if (holders.length === 0) log("no eligible holders in the sheet");

let state = {};
try {
  state = JSON.parse(fs.readFileSync(statePath, "utf8"));
} catch {
  log(`no state file yet (${statePath}) — first run, everyone starts fresh`);
}
let callouts = {};
try {
  callouts = JSON.parse(fs.readFileSync(calloutsPath, "utf8"));
  log(`callout credits loaded for ${Object.keys(callouts).length} wallets`);
} catch {
  // no callouts file: no callout bonuses this run
}

const weighted = [];
let benched = 0;
for (const h of holders) {
  const prev = state[h.wallet] ?? { peak: h.balance, last: h.balance, streak: 0 };
  const peak = Math.max(prev.peak, h.balance);
  const soldFraction = peak > 0 ? 1 - h.balance / peak : 0;
  const held = h.balance >= prev.last * 0.9;
  const streak = held ? prev.streak + 1 : 0;
  state[h.wallet] = { peak, last: h.balance, streak };

  if (soldFraction > SELL_LIMIT) {
    benched += 1;
    continue; // sold too much off the top -> no payout this epoch
  }
  const streakMult = Math.min(STREAK_CAP, 1 + streak * STREAK_BONUS);
  const calloutMult = Math.min(CALLOUT_CAP, 1 + (Number(callouts[h.wallet]) || 0) * CALLOUT_BONUS);
  weighted.push({ wallet: h.wallet, weight: h.balance * streakMult * calloutMult });
}
if (benched > 0) log(`sell penalty: ${benched} wallet(s) benched (sold >${SELL_LIMIT * 100}% of peak)`);

// SOL only — the pool is the holder share of CLAIMED fees (percentage-based),
// never token supply.
const totalWeight = weighted.reduce((sum, p) => sum + p.weight, 0);
const pool = sheet.buckets?.fomo ?? 0;

const payouts = weighted
  .map((p) => ({ wallet: p.wallet, amount: totalWeight > 0 ? (pool * p.weight) / totalWeight : 0 }))
  .filter((p) => p.amount >= MIN_PAYOUT_SOL)
  .sort((a, b) => b.amount - a.amount);
const totalPay = payouts.reduce((sum, p) => sum + p.amount, 0);
log(`payable now: ${payouts.length} wallets, ${totalPay.toFixed(4)} SOL (weighted by hold streaks + callouts)`);

// ---------- 3. airdrop ----------
const payer = loadKeypair(payPath ?? claimPath);
if (!payPath) log("paying directly from the claim (dev) wallet");
log(`payout wallet: ${payer.publicKey.toBase58()}`);

const payerBalance = sol(await connection.getBalance(payer.publicKey));
log(`payout wallet balance: ${payerBalance.toFixed(4)} SOL`);
if (send && payerBalance < totalPay * 1.01) {
  console.error(
    `Payout wallet holds ${payerBalance.toFixed(4)} SOL but the sheet needs ~${totalPay.toFixed(4)}. ` +
      `Top it up first. No transfers made.`,
  );
  process.exit(1);
}

if (!send) {
  for (const p of payouts.slice(0, 10)) {
    log(`would send ${p.amount.toFixed(6)} SOL -> ${p.wallet}`);
  }
  if (payouts.length > 10) log(`…and ${payouts.length - 10} more`);
  log("dry run complete — pass --send to do it for real");
  process.exit(0);
}

let sent = 0;
for (const p of payouts) {
  try {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: new PublicKey(p.wallet),
        lamports: Math.floor(p.amount * LAMPORTS_PER_SOL),
      }),
    );
    const signature = await connection.sendTransaction(tx, [payer]);
    await connection.confirmTransaction(signature, "confirmed");
    sent += 1;
    log(`sent ${p.amount.toFixed(6)} SOL -> ${p.wallet}  ${signature}`);
  } catch (error) {
    console.error(`FAILED -> ${p.wallet}: ${error.message}`);
  }
}
log(`airdrop complete: ${sent}/${payouts.length} confirmed`);
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
log(`holder state saved to ${statePath} — sell penalties and streaks carry to the next run`);
