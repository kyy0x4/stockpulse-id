-- StockPulse ID — schema realtime harga saham
-- Jalankan di Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "pgcrypto";

-- Tabel harga intraday (snapshot terbaru per ticker, di-upsert tiap polling)
create table if not exists public.stock_quotes (
  ticker text primary key,
  name text,
  sector text,
  price numeric,
  change numeric,
  volume numeric,
  market_cap text,
  per numeric,
  pbv numeric,
  composite numeric,
  signal text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Tabel history harian (untuk analisa jangka panjang / seasonality)
create table if not exists public.stock_history (
  ticker text not null,
  date date not null,
  open numeric,
  high numeric,
  low numeric,
  close numeric,
  volume numeric,
  primary key (ticker, date)
);

-- Tabel sesi perdagangan: record data terakhir yang sudah di-capture per sesi
create table if not exists public.market_sessions (
  session_date date primary key,
  closed_at timestamptz,
  status text not null default 'open', -- open | eod_pushed
  pushed_count int not null default 0
);

-- Realtime: publikasikan perubahan tabel stock_quotes ke klien web
alter publication supabase_realtime add table public.stock_quotes;

-- RLS: aman default, izinkan baca publik (write hanya dari service role backend)
alter table public.stock_quotes enable row level security;
alter table public.stock_history enable row level security;
alter table public.market_sessions enable row level security;

create policy "public read stock_quotes" on public.stock_quotes
  for select using (true);
create policy "public read stock_history" on public.stock_history
  for select using (true);
create policy "public read market_sessions" on public.market_sessions
  for select using (true);

-- Index
create index if not exists idx_stock_history_ticker_date
  on public.stock_history (ticker, date desc);