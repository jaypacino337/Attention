# Attention Markets

The attention layer of Solana. Fees pay the people who find attention, hold it, and call it out.

Next.js 15 (App Router) · React 19 · Tailwind v4 · Solana wallet sign-in.

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

## Two things to set before this is live

Everything renders without them, but the token side is inert until both are set:

| Variable | Why it matters |
| --- | --- |
| `NEXT_PUBLIC_ATTENTION_MINT` | The pump.fun mint address. Without it no balance can be read, so nobody is eligible and the terminal stays locked. The UI says **"preview mode"** rather than showing a fake `0`. |
| `SESSION_SECRET` | Signs session cookies and sign-in challenges. 32+ random chars (`openssl rand -base64 32`). The app refuses to start in production without it. |

Also strongly recommended: `SOLANA_RPC_URL` pointing at Helius/Triton/QuickNode. The
default public endpoint is rate limited and will fail under real traffic.

## The economics, in one file

`lib/config.ts` is the single source of truth. Fee split, tier thresholds and the
terminal gate all read from it, so changing the numbers is a one-file edit and the
site, the API and the reward math cannot drift apart. The fee split is asserted to
total 100% at module load — a bad edit throws instead of silently shipping.

| Share | Pool | Who it pays |
| --- | --- | --- |
| 30% | Callout Rewards | Holders who surface plays early and keep holding them |
| 30% | FOMO & Daily | Daily pot plus FOMO rounds, shared by holding size |
| 30% | X Attention Rewards | Measured reach from **verified** linked X accounts |
| 10% | Attention Wallet & Scanner | Trades, makes its own callouts; profit + rewards buy and burn |

**Tiers** — `250,000` ATTENTION (Watcher) qualifies for rewards and opens the
terminal; `500,000` (Operator) earns at 2x weight and unlocks the top-wallets and
chain-flow panels.

> You said "500,000 or 250k minimum". I read that as two tiers with 250k as the
> floor. If it was meant to be a single 500k threshold, change `MIN_ELIGIBLE` in
> `lib/config.ts` and everything follows.

## How the gating actually works

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

- **Terminal data** (`lib/terminal.ts`) returns sample rows and reports
  `source: "sample"`; the terminal renders a visible *"sample data — live feeds not
  connected"* badge. Swap the body of `getTerminalFeed()` for real reads (Helius /
  Birdeye / Dune for flow and holders, an X listener for social velocity) and return
  `source: "live"`. No UI change needed.
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

**Still future work:** X reach scoring (needs X API), automated callout
detection, and on-chain payout execution.

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
