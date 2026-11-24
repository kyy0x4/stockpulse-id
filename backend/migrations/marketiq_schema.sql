-- MARKETIQ Database Migrations
-- Run this in Supabase SQL Editor (SQL → New query → paste → Run)

-- ═══════════════════════════════════════════════════════════
-- 1. alerts (feature alert per-user)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.alerts (
    id bigint generated always as identity primary key,
    user_id uuid not null,
    ticker text not null,
    type text not null check (type in ('price_above','price_below','signal_buy','signal_sell')),
    value double precision,
    triggered boolean default false,
    last_triggered_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index if not exists idx_alerts_user on public.alerts(user_id);
create index if not exists idx_alerts_active on public.alerts(triggered) where triggered = false;

-- ═══════════════════════════════════════════════════════════
-- 2. plan column di profiles (monetization)
-- ═══════════════════════════════════════════════════════════
alter table public.profiles add column if not exists plan text default 'free';
create index if not exists idx_profiles_plan on public.profiles(plan);

-- ═══════════════════════════════════════════════════════════
-- 3. Subscriptions (Stripe integration - siap produksi)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.subscriptions (
    id bigint generated always as identity primary key,
    user_id uuid not null,
    stripe_subscription_id text unique,
    stripe_customer_id text,
    plan text not null default 'free',
    status text not null default 'active',
    current_period_end timestamptz,
    cancel_at_period_end boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);

-- ═══════════════════════════════════════════════════════════
-- 4. API Keys (developer tier / enterprise)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.api_keys (
    id bigint generated always as identity primary key,
    user_id uuid not null,
    key text unique not null,
    name text,
    rate_limit int default 60,
    last_used_at timestamptz,
    created_at timestamptz default now()
);
create index if not exists idx_api_keys_key on public.api_keys(key);

-- ═══════════════════════════════════════════════════════════
-- 5. Usage Metrics (billing & rate limit audit)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.usage_metrics (
    id bigint generated always as identity primary key,
    user_id uuid not null,
    metric text not null,  -- 'api_calls', 'alerts_triggered', 'data_export'
    value int default 1,
    period text not null,  -- '2026-11' (YYYY-MM)
    recorded_at timestamptz default now(),
    unique(user_id, metric, period)
);
create index if not exists idx_usage_period on public.usage_metrics(user_id, period);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security (keamanan data per-user)
-- ═══════════════════════════════════════════════════════════
-- Biarkan backend (service_role) bypass RLS; frontend pakai anon.
-- Ini penting: user tidak boleh baca watchlist/aler user lain.
alter table public.watchlist enable row level security;
alter table public.alerts enable row level security;
alter table public.portfolio_holdings enable row level security;
alter table public.portfolio_trades enable row level security;
alter table public.subscriptions enable row level security;

create policy "watchlist_own" on public.watchlist for all
  using (auth.uid() = user_id);
create policy "alerts_own" on public.alerts for all
  using (auth.uid() = user_id);
create policy "portfolio_holdings_own" on public.portfolio_holdings for all
  using (auth.uid() = user_id);
create policy "portfolio_trades_own" on public.portfolio_trades for all
  using (auth.uid() = user_id);
create policy "subscriptions_own" on public.subscriptions for select
  using (auth.uid() = user_id);
