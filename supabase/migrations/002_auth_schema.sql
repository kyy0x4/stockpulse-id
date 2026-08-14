-- PlotFinansial — schema autentikasi & data per-user (profiles, watchlist, portfolio)
-- Jalankan di Supabase SQL Editor (Dashboard → SQL → New query)
-- Seluruh akses data user lewat backend API (service role). RLS aktif tanpa policy
-- publik sehingga tabel ini hanya bisa diakses service role.

create extension if not exists "pgcrypto";

-- Profil user (email + password lokal, atau akun hasil login Google via Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  password_hash text,               -- PBKDF2-SHA256, hanya untuk akun provider 'email'
  provider text not null default 'email', -- email | google
  google_id text,
  is_verified boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Kode verifikasi (OTP 6 digit) untuk aktivasi akun email
create table if not exists public.auth_codes (
  id bigserial primary key,
  email text not null,
  code_hash text not null,          -- sha256 dari kode (tidak disimpan plaintext)
  purpose text not null default 'verify',
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

-- Watchlist per user
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticker text not null,
  created_at timestamptz not null default now(),
  unique (user_id, ticker)
);

-- Posisi portofolio per user (jumlah & harga rata-rata diperbarui dari tiap transaksi)
create table if not exists public.portfolio_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticker text not null,
  qty numeric not null default 0,
  avg_cost numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, ticker)
);

-- Riwayat transaksi (buy / sell) per user
create table if not exists public.portfolio_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticker text not null,
  side text not null check (side in ('buy', 'sell')),
  qty numeric not null check (qty > 0),
  price numeric not null check (price > 0),
  fee numeric not null default 0,
  trade_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- RLS: hanya service role yang boleh akses (tanpa policy publik)
alter table public.profiles enable row level security;
alter table public.auth_codes enable row level security;
alter table public.watchlist enable row level security;
alter table public.portfolio_holdings enable row level security;
alter table public.portfolio_trades enable row level security;

-- Index
create index if not exists idx_watchlist_user on public.watchlist (user_id);
create index if not exists idx_holdings_user on public.portfolio_holdings (user_id);
create index if not exists idx_trades_user_ticker on public.portfolio_trades (user_id, ticker);
create index if not exists idx_codes_email on public.auth_codes (email);
