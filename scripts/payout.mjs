#!/usr/bin/env node
/**
 * Local payout runner — run this on YOUR machine, never on the web server.
 *
 * The site computes who is owed what (/api/epoch); this script sends it.
 * The payer keypair stays local, so the deployment never holds a private key.
 *
 * Usage:
 *   1. Get the sheet:
 *        curl -H "x-admin-key: $ADMIN_KEY" \
 *          "https://<your-site>/api/epoch?revenue=12.5" > sheet.json
 *   2. Dry run (default — prints what WOULD be sent, sends nothing):
 *        node scripts/payout.mjs sheet.json ~/payer.json
 *   3. Actually send:
 *        node scripts/payout.mjs sheet.json ~/payer.json --send
 *
 * payer.json is a standard Solana keypair file (e.g. from `solana-keygen`).
 * Only the `fomo` amounts are paid — callout/social need scores attached
 * first, and the sheet marks them unclaimed. Amounts are in SOL.
 */
import fs from "node:fs";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const [, , sheetPath, keypairPath, ...flags] = process.argv;
const send = flags.includes("--send");

if (!sheetPath || !keypairPath) {
  console.error("usage: node scripts/payout.mjs <sheet.json> <payer-keypair.json> [--send]");
  process.exit(1);
}

const rpcUrl = process.env.SOLANA_RPC_URL;
if (!rpcUrl) {
  console.error("Set SOLANA_RPC_URL (a dedicated RPC, not the public endpoint).");
  process.exit(1);
}

const sheet = JSON.parse(fs.readFileSync(sheetPath, "utf8"));
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf8"))),
);

const MIN_PAYOUT_SOL = 0.001; // dust guard: skip amounts that cost more than they're worth
const payouts = (sheet.payouts ?? [])
  .map((p) => ({ wallet: p.wallet, sol: p.amounts?.fomo ?? 0 }))
  .filter((p) => p.sol >= MIN_PAYOUT_SOL);

const total = payouts.reduce((sum, p) => sum + p.sol, 0);
console.log(`payer:   ${payer.publicKey.toBase58()}`);
console.log(`payouts: ${payouts.length} wallets, ${total.toFixed(4)} SOL total (fomo pool only)`);
console.log(`mode:    ${send ? "SEND" : "dry run — pass --send to transfer"}\n`);

const connection = new Connection(rpcUrl, "confirmed");
const balance = (await connection.getBalance(payer.publicKey)) / LAMPORTS_PER_SOL;
console.log(`payer balance: ${balance.toFixed(4)} SOL`);
if (send && balance < total * 1.01) {
  console.error("Payer balance won't cover the sheet plus fees. Aborting before any transfer.");
  process.exit(1);
}

let sent = 0;
for (const payout of payouts) {
  const lamports = Math.floor(payout.sol * LAMPORTS_PER_SOL);
  if (!send) {
    console.log(`would send ${payout.sol.toFixed(6)} SOL -> ${payout.wallet}`);
    continue;
  }
  try {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: new PublicKey(payout.wallet),
        lamports,
      }),
    );
    const signature = await connection.sendTransaction(tx, [payer]);
    await connection.confirmTransaction(signature, "confirmed");
    sent += 1;
    console.log(`sent ${payout.sol.toFixed(6)} SOL -> ${payout.wallet}  ${signature}`);
  } catch (error) {
    // Keep going: one bad recipient must not strand the rest of the epoch.
    console.error(`FAILED -> ${payout.wallet}: ${error.message}`);
  }
}

if (send) console.log(`\ndone: ${sent}/${payouts.length} transfers confirmed`);
