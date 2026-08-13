# PlotFinansial — Panduan Setup Supabase Realtime

Arsitektur near-realtime gratis:

```
[cron tiap 1 mnt saat jam bursa] ─▶ /api/cron/poll ─▶ build_all (cache Yahoo)
                                                        │
                                              upsert stock_quotes (Supabase)
                                                        │
[Browser] ◀── Supabase Realtime (websocket push) ───────┘
```

- Harga dihubungkan lewat Yahoo (delay ~15 mnt), tapi dipolling tiap 1 menit
  sehingga UI terasa live. Data tersimpan di Supabase dan tidak hilang saat
  serverless cold start.
- Tiap malam 15:50 WIB `/api/cron/eod` menyimpan bar harian ke
  `stock_history` untuk analisa jangka panjang.

## 1. Buat project Supabase

1. Buka https://supabase.com → New project → pilih region **Singapore** (paling dekat ke Indonesia).
2. Tunggu hingga selesai, buka **SQL Editor** → **New query** → paste isi
   `supabase/migrations/001_realtime_schema.sql` → **Run**.

## 2. Ambil kredensial

Dashboard → **Project Settings → API**:
- `Project URL` → isi `VITE_SUPABASE_URL` (frontend) & `SUPABASE_URL` (backend).
- `anon public` key → `VITE_SUPABASE_ANON_KEY` (frontend, aman dipublish).
- `service_role` key → `SUPABASE_SERVICE_KEY` (backend, RAHASIA — hanya di server).

## 3. Set env di deployment

**Vercel** (Project → Settings → Environment Variables):
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

Redeploy setelah set env (commit atau `vercel --prod`).

> Tanpa env, app tetap berjalan normal (collect harga manual via Yahoo, tanpa
> realtime). Semua fungsi realtime otomatis no-op.

## 4. Jadwalkan polling (gratis)

Supabase punya **Scheduled Functions** (pg_cron) berbasis webhook, dua job:

**Job 1 — Polling intraday** (tiap menit, saat jam bursa WIB; 02:00–08:55 UTC, Senin–Jumat):
- Cron: `* * 2-8 * * 1-5`
- Method: `GET` URL `https://<domain>/api/cron/poll`

**Job 2 — End of day** (15:50 WIB = 08:50 UTC, Senin–Jumat):
- Cron: `50 8 * * 1-5`
- Method: `GET` URL `https://<domain>/api/cron/eod`

Alternatif (tanpa pg_cron): cron-job.org — createjob, URL
`https://<domain>/api/cron/poll`, schedule `.env.<pattern>` tiap 1 menit.
Backend sendiri sudah menolak (no-op) request di luar jam bursa, jadi aman.

Cek status: buka `https://<domain>/api/cron/status` → tampil waktu WIB,
apakah sedang jam bursa, dan apakah Supabase terhubung.

## 5. Verifikasi realtime

- Buka app → topbar tampil badge **LIVE** (hijau) jika Supabase tersambung.
- Saat `/api/cron/poll` jalan, harga/change di tabel saham diperbarui otomatis
  tanpa reload (websocket push).
- Data tersimpan di tabel `stock_quotes` → bisa direstore kapan saja,
  dan `/stocks` otomatis memakai snapshot Supabase saat cold start (lebih cepat
  daripada build ulang dari Yahoo).