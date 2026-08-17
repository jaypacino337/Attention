# Attention Markets

The attention layer of Solana. Find attention. Create attention. Get rewarded for it.

Next.js 15 (App Router) · React 19 · Tailwind v4.

**Reward model: automatic airdrops.** Nobody connects a wallet — the protocol scans
every holder on-chain (`/api/epoch`) and payouts are sent to them directly
(`scripts/payout.mjs`). Holding the token is the registration. Wallet connect and
the full auth stack (challenge/verify/sessions, token gating) remain in the
codebase but are OFF by default; enable with `NEXT_PUBLIC_WALLET_CONNECT=true`
plus the mint if per-wallet features ever return. With connect off, the Terminal
is public.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run dev                   # http://localhost:3000
```

```bash
npm run build      # production build
npm test           # reward-math tests
npm run typecheck  # tsc --noEmit
```

## Go-live env vars

| Variable | Why it matters |
| --- | --- |
| `NEXT_PUBLIC_ATTENTION_MINT` | The pump.fun mint address — turns on live stats, holder scans and the leaderboard. |
| `SOLANA_RPC_URL` | Dedicated RPC (Helius/Triton/QuickNode). Holder scans refuse the public endpoint. |
| `ADMIN_KEY` | 16+ random chars — locks the `/api/epoch` payout-sheet endpoint. |

`SESSION_SECRET` is only needed if wallet connect is ever re-enabled.

## The economics, in one file

`lib/config.ts` is the single source of truth. Fee split, tier thresholds and the
terminal gate all read from it, so changing the numbers is a one-file edit and the
site, the API and the reward math cannot drift apart. The fee split is asserted to
total 100% at module load — a bad edit throws instead of silently shipping.

| Share | Pool | Who it pays |
| --- | --- | --- |
| 25% | Pump.fun | Wallets calling out $ATTENTION on pump.fun, weighted by holdings + callouts |
| 25% | FOMO | Wallets spreading $ATTENTION through FOMO each epoch |
| 40% | X | The biggest pool — posting and maintaining $ATTENTION on X |
| 10% | Attention Fund | Trades and makes callouts; profits + rewards buy back and burn |

**Eligibility** — one floor: `250,000` $ATTENTION. Hold it and you're in every
pool; rewards airdrop automatically, nothing to claim.

## How the (dormant) wallet gating works

1. Browser asks `/api/auth/challenge` for a challenge bound to the wallet.
2. Wallet signs a plain-text message that states it is **a signature only — no
   transaction, no fee, no approval**.
3. `/api/auth/verify` rebuilds that message server-side and checks the ed25519
   signature. It never trusts the text the client claims it signed.
4. On success an HMAC-signed, HttpOnly session cookie is issued.
5. Every gated request re-reads the balance from chain. **Balance is not cached in
   the session**, so a wallet that sells below the gate loses access on the next
   request instead of coasting until the cookie expires.

Challenges are stateless (`expiry.hmac`) rather than rows in a nonce table — on
serverless the next request may hit a different instance, and an in-memory nonce
map would reject valid logins at random.

The gate is enforced in `app/api/terminal/route.ts`, not only in the page. Page-only
gating is decoration: anyone can call the API directly.

## What is real and what is stubbed

Verified working (see `npm test` and the checks below):

- Wallet connect → challenge → ed25519 verification → session. Forged signatures,
  signatures from a different keypair, tampered challenges and tampered cookies are
  all rejected.
- Server-side token gating on a live balance read, with correct locked/preview states.
- Reward split and eligibility math, including tier weighting and roll-forward of
  unclaimed pools.
- Wallet ↔ X linking, with one-handle-one-wallet enforced.

Deliberately stubbed, and labelled as such in the UI:

- **Terminal data** (`lib/terminal.ts`) serves NO sample rows: the feed is empty
  (`source: "empty"`, rendered as a scanning state) until data/terminal.json is
  curated (`source: "manual"`) or live reads land (`source: "live"`). Swap the body
  of `getTerminalFeed()` for real reads when integrations arrive; no UI change
  needed.
- **X verification.** A handle submitted from the account page is stored
  `verified: false`. Self-declaring a handle proves nothing, so `distributeEpoch()`
  pays the social pool **only** to verified links. Wire X OAuth 2.0 (PKCE) and flip
  the flag in the callback before running social rewards.
- **Payouts.** `lib/rewards.ts` computes who is owed what; it does not send
  anything. Sending needs a funded payer and a transfer job — keep that key off the
  web server.
- **Persistence.** `lib/store.ts` is a JSON file behind a narrow interface. It is
  **not durable on Vercel** (ephemeral, per-instance filesystem). Swap `read`/`write`
  for Postgres, Vercel KV or Redis before real social rewards; nothing outside that
  file changes.

Not verifiable from the build environment: live RPC balance reads. This sandbox
blocks outbound egress to `api.mainnet-beta.solana.com`, so the balance path is
exercised only through its unconfigured branch. Set the mint and an RPC url locally
and connect a real wallet to confirm end to end.

## Automated vs manual

The build sandbox can't reach pump.fun or Solana RPCs, but **the deployed site
can** — so automation runs in production, not here.

**Automated once env vars are set (no hands needed):**

- **Live token stats** — the homepage strip pulls market cap / price / replies
  from pump.fun every 60s (`lib/pumpfun.ts`). Renders nothing on API failure
  rather than fake numbers. Needs only the mint.
- **Holder scan** — `lib/holders.ts` walks every token account for the mint and
  sums per owner, so "every holder above 250k" is one call. Needs a dedicated
  RPC (`SOLANA_RPC_URL`); it refuses to run against the public endpoint, which
  would just error at this size.
- **Daily/FOMO payout sheet** — `GET /api/epoch?revenue=<SOL>` with header
  `x-admin-key: $ADMIN_KEY` scans eligible holders live and returns each
  wallet's daily/FOMO share for that revenue, ready to pay. Callout and social
  pools come back as unclaimed until you attach scores — those need judgement
  and X metrics. The endpoint never touches private keys; paying is a separate,
  deliberate act.

**Manual, by design (edit a file on GitHub → auto-redeploy):**

- **Terminal data / callouts** — copy `data/terminal.example.json` to
  `data/terminal.json`, put real rows in, commit. The terminal shows your data
  with a "curated by the team" badge. Delete the file to fall back to sample
  data. This is the manual path until live feeds are wired.
- **Ad placements** — `ADS_JSON` env var, as before.

**Autopilot (runs on the operator's machine, never the server):**
`scripts/autopilot.mjs` claims pump.fun creator fees (signed locally via
PumpPortal's local-transaction API), pulls the payout sheet from the site, and
airdrops the holder pool — dry run by default, `--send` for real, cron-able.
Keys live only in local keypair files. See the header comment for setup.

**Still future work:** X reach scoring (needs X API) and automated callout
scoring.

## Rate limiting

There is none. `/api/auth/challenge` and `/api/me` are cheap but hit an RPC. Add
Vercel KV or Upstash rate limiting before you get attention you did not ask for.

## Product surfaces

- **Homepage** — hero → Live Attention module (Trending / Callouts / X Attention /
  Scanner tabs) → fee engine + flywheel → Scanner preview → Earn Attention →
  Fund preview → holder access. Product first, docs second.
- **/scanner** — the Attention Scanner's permanent public record. Calls live in
  `data/scanner.json` (append-only: close bad calls, never delete). Template in
  `data/scanner.example.json`. The Attention Score is modular
  (`lib/attention-score.ts`) — inputs and weights are data, not a hardcoded formula.
- **/fund** — transparent Attention Fund dashboard fed by `data/fund.json`
  (template `data/fund.example.json`): stats, open positions, closed trades,
  callouts, buyback and burn history, every entry with an explorer link. Renders an
  honest empty state until real data exists; losses are shown, not hidden.
- **/advertise** — ad inventory moved off the homepage (attention protocol, not ad
  network). Same working `ADS_JSON` mechanics.
- **/terminal** — token-gated; panels: Scanner, X Attention, Trending, plus
  500K-gated Top Wallets and Chain Flow.

No surface ever shows fake data as real: empty and loading states beat invented
numbers, and the built-in terminal sample rows are labelled and never used on the
homepage module.

## Layout

```
app/
  page.tsx              landing: hero, live attention, fee engine, scanner, fund, tiers
  scanner/page.tsx      permanent scanner record
  fund/page.tsx         attention fund dashboard
  advertise/page.tsx    ad inventory (relocated)
  account/page.tsx      wallet status + X linking
  terminal/page.tsx     token-gated terminal (server-side gate)
  api/auth/*            challenge / verify / logout
  api/me                live account snapshot
  api/terminal          gated feed
  api/x/link            bind or unbind an X handle
components/             wallet context, panels, ad slots, brand mark
lib/
  config.ts             tokenomics — edit here
  rewards.ts            pure epoch distribution math
  challenge.ts          stateless sign-in challenges
  session.ts            HMAC HttpOnly sessions
  solana.ts             server-side balance reads
  terminal.ts           terminal feed (sample; swap for live)
  store.ts              wallet ↔ X links (swap for a DB)
  ads.ts                self-served ad inventory
tests/rewards.test.ts   reward math
```

## Deploying

Vercel, framework preset Next.js, no build overrides. Set `NEXT_PUBLIC_ATTENTION_MINT`,
`SESSION_SECRET` and `SOLANA_RPC_URL` in project env vars, then redeploy — Next inlines
`NEXT_PUBLIC_*` at build time, so changing them requires a rebuild, not just a restart.

## Roadmap hooks already in place

- **Ad space** — `lib/ads.ts` sells slots from an owned list. No third-party ad script
  runs on pages where people connect wallets.
- **Paid attention placements** — same mechanism; add slots to `AdSlotId`.
- **Terminal expansion** — `TerminalFeed` is the contract; add panels to the type and
  they flow through the gate and tier logic unchanged.

## Safety note

The site never asks for a seed phrase, never requests a transaction to log in, and
the sign-in message says so in plain words. Keep it that way — a login flow that
looks like a transaction is how holders get drained.
