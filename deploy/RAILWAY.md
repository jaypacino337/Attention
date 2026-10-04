# Payouts: two Railway services, one shared memcoinz image

Attention no longer pays from scripts on a laptop. Payouts run on the shared
**memcoinz flywheel image** (`memcoinz/deploy/worker`), configured purely by
variables. No Attention-specific worker code exists. The site only publishes
the 𝕏 caller list that the worker reads.

```
pump.fun creator fees ──► [1] attention-flywheel  (worker, every 60 min)
                              ├─ 50% airdrop ──► every holder ≥ 250K, pro-rata, 4% cap
                              ├─ 10% buyback ──► market-buy $ATTENTION + burn
                              └─ 40% treasury ─► 𝕏 POOL WALLET
                                                     │
                          [2] attention-x-pool  (cron, every 6 h)
                              └─ wallet balance − 0.05 SOL ──► equal split between
                                 wallets seated at  GET <site>/api/seats  that hold ≥ 250K
```

Why two services: the stock worker routes ONE airdrop pool per creator wallet,
and Attention has two pools with different eligibility. Service 1 is the stock
worker; service 2 is the same image running the stock `/airdrop` script on a
cron, with `seats.url` pointing at this site so **only linked 𝕏 callers** get
the 𝕏 pool. Both match `lib/config.ts` (`FEE_SPLIT`, `HOLDER_POOL`, `X_POOL`).

## Wallets (create both before deploying)
| wallet | holds | used by |
|---|---|---|
| **creator** `CAyFreCy5swxRdBygKThKmQf37aAeZrqK7TeJjXobexb` (from the bonding curve) | claims fees, pays holders, buys/burns | service 1 (`CREATOR_KEYPAIR`) |
| **𝕏 pool wallet**: a NEW keypair used for nothing else | 40% of fees between payouts | service 2 (`XPOOL_KEYPAIR`); its public key goes in service 1's `payTo.treasury` |

Fund each with ~0.05 SOL for transaction fees and ATA/rent edge cases.

## Service 1: `attention-flywheel` (stock worker)
Railway → New service → GitHub repo `memcoinz` (branch `claude/solana-skills`) →
Settings → Config-as-code path `deploy/worker/railway.json` → add a **Volume** at `/data`.

Variables:
```
MEMCOIN_CONFIG_JSON = <deploy/flywheel.memcoin.json on one line, with payTo.treasury = 𝕏 pool wallet pubkey>
CREATOR_KEYPAIR     = <creator secret, base58 or JSON array>        ← sealed variable
SOLANA_RPC_URL      = https://mainnet.helius-rpc.com/?api-key=…     ← dedicated RPC required for snapshots
HELIUS_API_KEY      = …                                             (optional, faster snapshots)
RAILWAY_RUN_UID     = 0
LIVE                = (unset for a dry-run week, then "true")
```
`/health` shows cycles, failures and the last error. Ledgers on `/data` make a
crashed payout resume without paying anyone twice.

## Service 2: `attention-x-pool` (same image, cron)
Same repo, branch, config path and Dockerfile. Add a **Volume** at `/data`.
Settings → **Cron schedule** `0 */6 * * *` → **Custom start command**:
```
sh -c 'cd /data && printf %s "$MEMCOIN_CONFIG_JSON" > memcoin.config.json && /app/node_modules/.bin/tsx /app/.claude/skills/airdrop/scripts/airdrop.ts --pot balance --mode equal $SEND'
```
Remove the healthcheck for this service (cron jobs exit when done).

Variables:
```
MEMCOIN_CONFIG_JSON = <deploy/xpool.memcoin.json on one line, seats.url = the live site URL>
XPOOL_KEYPAIR       = <𝕏 pool wallet secret>                        ← sealed variable
SOLANA_RPC_URL      = (same dedicated RPC)
RAILWAY_RUN_UID     = 0
SEND                = (unset = dry run; "--send" to pay)
```
What it does each run (all memcoinz code):
1. `GET <seats.url>/api/seats?mint=…` → the live, verified callers. If the site or
   its storage is down this returns 503 and the run **refuses to pay** instead
   of paying an empty or stale list.
2. Snapshots holders ≥ 250K on-chain and keeps only seated wallets (PDAs,
   pools and the payer excluded).
3. Pays the wallet balance minus 0.05 SOL in equal shares; frozen plan + ledger
   on `/data`. Because the pot is "balance", a re-run after a crash can never
   re-send money that already left.

Optional: `POST <site>/api/seats/sweep` (permissionless, 60 s cooldown) frees
seats whose wallet sold below 250K. Payouts don't depend on it (step 2 already
filters by balance), but it keeps the public board honest; hit it from any
uptime pinger every few hours.

## Go-live checklist
1. Supabase project → SQL editor → run `supabase/schema.sql`. Vercel env:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_`), `SOLANA_RPC_URL`.
2. Deploy the site; confirm `GET https://<site>/api/seats` returns `"storage":"supabase"`.
3. Create service 1 and service 2 in dry-run mode; read their logs for a week.
4. Set `LIVE=true` on service 1 and `SEND=--send` on service 2.

## Verified here (2026-10-04, no transactions sent)
- Service 1: the stock worker accepted `flywheel.memcoin.json` (route 50/40/10,
  `payTo.treasury`), ran a full dry-run cycle against mainnet (claimable read →
  "skipping, under 0.005 SOL") and exited cleanly with `ONCE=true`; a route
  totalling 90 is refused.
- Service 2: the stock airdrop script parsed `xpool.memcoin.json`, loaded the
  key from the named env var and stopped at the snapshot's dedicated-RPC guard
  (no RPC key in the sandbox). memcoinz `seatedWallets()` read exactly the 11
  seated wallets from this site's `/api/seats` on a seeded throwaway store.
- Not verified: a snapshot + airdrop dry run with a dedicated RPC, and the
  Railway cron/volume combo itself.
