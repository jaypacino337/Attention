# Attention Markets ($ATTENTION)

Attention pays: pump.fun creator fees from $ATTENTION
(`CSL5S49M4RBJZuvm289x4Mt7AtSsprWmZe7ne3Xppump`, Token-2022) are routed every
cycle, **50% to holders, 40% to verified 𝕏 callers, 10% buyback & burn**,
straight to wallets. Nothing to claim, nothing to sign.

Next.js 16 · React 19 · Tailwind v4 · motion · memcoinz skills (seats, snapshot, airdrop, flywheel).

```bash
npm install
cp .env.example .env.local   # optional in dev: storage falls back to ./.data
npm run dev                  # http://localhost:3000
npm run typecheck && npm test && npm run build
```

## How it fits together

| piece | where | what |
|---|---|---|
| Economics | `lib/config.ts` | fee split, 250K floor, holder-pool cap, 𝕏-pool window/handle. One file. |
| 𝕏 verification | `lib/seats-core.ts` (ported memcoinz seats), `lib/callers.ts` | wallet-bound phrase `@Attn_Markets_ $ATTENTION give me a seat · <code>`, verified free via `publish.x.com/oembed`. No 𝕏 OAuth, no API key. |
| Storage | `lib/store.ts` → `store.supabase.ts` / `store.file.ts` | Supabase (jsonb + `version` optimistic locking) when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, JSON files otherwise. On Vercel without Supabase, linking is refused instead of losing data. Schema: `supabase/schema.sql`. |
| Payouts | **Railway**, shared memcoinz image | see `deploy/RAILWAY.md`: stock flywheel worker (holders + burn + feed the 𝕏 pool wallet) and a cron running stock `/airdrop` with `seats.url` → this site. |
| Pages | `app/` | `/` magazine home, `/x` claim desk + public caller registry, `/rules` exact payout rules, `/scanner`, `/fund`, `/terminal`, `/advertise`. |

### API
- `GET /api/seats?mint=<MINT>[&wallet=]` → live callers (memcoinz seats contract; the worker reads `seats[].wallet`). 503 if storage is down, so payouts refuse rather than pay a wrong list.
- `POST /api/seats/claim {wallet, postUrl}` → verify the post, seat or renew. Refuses program accounts and wallets that read below 250K.
- `POST /api/seats/sweep {mint}` → permissionless, 60s cooldown: frees lapsed seats and wallets that sold below 250K (a failed RPC read never frees a seat).
- `GET /api/eligibility?wallet=` → both pools for one wallet. Read-only.

### 𝕏 pool scoring (published on `/rules`)
One verified 𝕏 account = one equal share. A seat lasts 7 days from the post's
own timestamp; posting a fresh callout renews it. Paid only while the wallet
holds 250K+. One account per wallet, one wallet per account, each post once.

## What was removed
- `scripts/payout.mjs`, `scripts/autopilot.mjs`, `scripts/easy.mjs`, `payout.bat/.command`, `/api/epoch`: replaced by the Railway services.
- The dormant wallet-connect/session stack, `/account` and `/api/x/link` (self-declared, never-verified handles): replaced by seats.
- The diamond-hands rules (sell penalty, streak and callout multipliers) that lived in local state on the operator's machine. The new rules are stateless and auditable.

## Checks
`npm test` (seats core, 𝕏-pool rules, both stores incl. a concurrent fake-PostgREST race, fee math) ·
`npm run typecheck` · `npm run build` · `mc qa http://localhost:3000` on `npm start`.
