#!/usr/bin/env node
/**
 * The easy payout runner — launched by double-clicking payout.bat (Windows)
 * or payout.command (Mac). Asks for everything it needs the FIRST time,
 * saves it locally, then every future run is: double-click, read the
 * preview, type YES.
 *
 * Everything stays on this computer: settings in payout-config.json, the
 * dev wallet key in dev.txt — both gitignored, never uploaded anywhere.
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, fallback = "") => {
  const answer = (await rl.question(q)).trim();
  return answer || fallback;
};

console.log("");
console.log("  ATTENTION MARKETS — payout autopilot");
console.log("  claims pump.fun fees -> airdrops SOL to every eligible holder");
console.log("");

// ---------- one-time setup, saved locally ----------
const CONFIG = "payout-config.json";
let cfg = {};
try {
  cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
} catch {
  console.log("  First-time setup (asked once, saved on this computer only):\n");
}

if (!cfg.rpc) {
  cfg.rpc = await ask("  1) Paste your Helius RPC URL (from helius.dev): ");
}
if (!cfg.adminKey) {
  cfg.adminKey = await ask("  2) Paste your ADMIN_KEY (same one you put in Vercel): ");
}
if (!cfg.site) {
  cfg.site = await ask(
    "  3) Your site URL [press Enter for https://attnmarkets.fun]: ",
    "https://attnmarkets.fun",
  );
}
fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2));

if (!fs.existsSync("dev.txt")) {
  console.log("\n  Your dev wallet key is not set up yet.");
  console.log("  Phantom -> Settings -> Manage Accounts -> your wallet -> Show Private Key.");
  console.log("  It will be saved to dev.txt ON THIS COMPUTER ONLY. Never share it with anyone.\n");
  const key = await ask("  Paste the private key: ");
  if (!key) {
    console.log("\n  No key entered — nothing saved. Run this again when ready.");
    process.exit(1);
  }
  fs.writeFileSync("dev.txt", key);
  console.log("  Saved to dev.txt.\n");
}

const env = {
  ...process.env,
  SOLANA_RPC_URL: cfg.rpc,
  ADMIN_KEY: cfg.adminKey,
  SITE_URL: cfg.site,
};
const run = (extra) =>
  spawnSync(process.execPath, ["scripts/autopilot.mjs", "--claim", "dev.txt", ...extra], {
    stdio: "inherit",
    env,
  });

// ---------- preview, then confirm, then send ----------
console.log("  PREVIEW (nothing is sent yet):\n");
const preview = run([]);
if (preview.status !== 0) {
  console.log("\n  Preview hit a problem (see above). Fix it and double-click again.");
  await rl.close();
  process.exit(1);
}

console.log("");
const confirm = await ask("  Type YES to claim fees and send the airdrop for real: ");
if (confirm.toUpperCase() === "YES") {
  console.log("");
  run(["--send"]);
  console.log("\n  Done. Double-click again next payout day.");
} else {
  console.log("\n  Cancelled — nothing was sent.");
}
await rl.close();
