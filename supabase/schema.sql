-- Attention Markets: 𝕏 caller registry. Run once in the Supabase SQL editor.
-- Same pattern as memcoinz preset-seats/supabase/schema.sql (jsonb + version).
-- RLS is ON with NO policies: the anon/public key can't touch this table.
-- Only the site's server (SUPABASE_SERVICE_ROLE_KEY, never NEXT_PUBLIC_) reads/writes.

create table if not exists public.attention_seats (
  mint        text primary key,
  data        jsonb not null,             -- the whole SeatCoin: seats, used posts, sweep stats
  version     integer not null default 0, -- optimistic concurrency: every write bumps it
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.attention_seats enable row level security;
