# PROGRESS — PulseTerminal

Terakhir diperbarui: **2026-11-22**

Dokumen ini merangkum pekerjaan terakhir supaya sesi berikutnya bisa lanjut tanpa
mengulang konteks. Baca ini + `git status` sebelum mulai.

---

## 1. Ringkasan

Produk di-pivot dari **PlotFinansial (saham IDX)** menjadi **PulseTerminal**:

- Saham AS (40 ticker) + ETF (10) + kripto spot (10)
- Indeks pasar: S&P 500, Nasdaq, Dow, BTC, ETH
- Berita global: saham AS, kripto, makro AS, geopolitik
- Halaman **Macro Monitor** dari FRED (12 indikator)
- Login email+password/OTP dan Google tetap dipertahankan

**Semua perubahan masih di working tree — belum di-commit.**

---

## 2. Status lokal saat ini

| Hal | Status |
|---|---|
| Frontend dev | `http://localhost:5173` (Vite, sudah jalan) |
| Backend dev | `http://localhost:8000` (uvicorn, sudah jalan) |
| Python | 3.11, venv di `backend/.venv` |
| Env backend | `backend/.env` (gitignored) |
| Env frontend | `.env.local` di root (gitignored) |
| Database | Supabase **production** `elymgecyzjsjephlhswe` |

Catatan penting:

- Backend lokal memakai **Supabase production**. Watchlist/portfolio yang dibuat
  saat dev akan masuk ke database yang sama dengan app live.
- `AUTH_SECRET` lokal dibuat baru. Token lama dari production akan ditolak,
  jadi user harus login ulang di lokal.
- Deployment Vercel production masih **versi lama** (97 hari, 934 ticker IDX,
  `/api/macro` dan `/api/market/index` masih 404). Belum di-deploy ulang.
- Env Vercel bertanda *sensitive* (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
  `AUTH_SECRET`) **tidak bisa** diambil lewat `vercel env pull` (hanya menjadi
  `"[SENSITIVE]"`). URL + anon key dipulihkan dari bundle production;
  service key diisi manual oleh user.

### Cara start backend

```bash
cd backend
.venv/bin/python -m uvicorn app.main:app --port 8000 --env-file .env
```

Stop: `lsof -ti tcp:8000 | xargs kill`

### Cara start frontend

```bash
npm run dev
```

**Restart Vite sekali** agar `.env.local` (Supabase URL + anon key) terbaca.
Tanpa restart, login email tetap jalan, tapi Google login & harga realtime mati.

---

## 3. Yang sudah dikerjakan

### 3.1 Universe aset (backend)

- `backend/app/data/tickers.py`
  - `US_STOCKS` (40), `ETFS` (10: SPY, QQQ, VOO, IWM, DIA, GLD, TLT, XLE, XLF, XLK),
    `CRYPTO` (10: BTC, ETH, SOL, XRP, ADA, DOGE, AVAX, LINK, DOT, LTC)
  - `MARKET_ASSETS` (SPX/IXIC/DJI/BTC/ETH), `NEW_ASSETS`, `NEW_ASSET_TICKERS`,
    `NEW_SECTOR_GROUPS` (termasuk `ETF` dan `Kripto`)
- `backend/app/services/market.py`
  - `yf_symbol()`: BTC → `BTC-USD`, BBCA → `BBCA.JK`, AAPL → `AAPL`, SPX → `^GSPC`
  - `asset_kind()`: `crypto` / `us_stock` / `etf` / `index`
  - `fetch_market_index()` menggantikan `fetch_ihsg()` (compat tetap ada)
  - Cache batch history diberi signature universe
  - `debtToEquity` Yahoo dinormalisasi persen → rasio (`145` → `1.45`)
  - ETF: market cap fallback ke `totalAssets`
- `backend/app/services/analysis.py`
  - `score_market_profile()` (dulu `score_crypto`) dipakai untuk **kripto + ETF**:
    momentum 30/90/365 hari, drawdown 52 minggu, ukuran/likuiditas
  - `combined_signal(kind)`: bobot teknikal lebih besar untuk kripto/ETF
- `backend/app/services/analysis_runner.py`
  - `_analyze()` / `_build_row()` sadar jenis aset, `has_financials`
  - `_fmt_cap()` (dulu `_fmt_idr`)
  - **FIX:** `default_currency` kini selalu `USD` (tidak ada lagi `IDR` untuk `idx`)
- `backend/app/routers/stocks.py`
  - `/api/market/index`, `/api/market/assets`, `/api/market/ihsg` (compat)
  - `/api/tickers` sekarang mengembalikan universe baru + filter `kind`
  - `/api/stocks` sekarang mendukung parameter `kind` untuk filter aset

### 3.2 Cron

- `backend/app/routers/cron.py`
  - Sesi saham AS dalam WIB (21:30–04:00), kripto polling 24/7
  - `_position()` dihapus (tidak terpakai)

### 3.3 Makro FRED (baru)

- `backend/app/services/macro.py`
  - 12 seri FRED: CPI/Core CPI/PCE (YoY), unemployment, payrolls (MoM),
    GDP riil (YoY), Fed Funds, UST 10Y/2Y, consumer sentiment, mortgage 30Y, WTI
  - Transform `level` / `yoy` / `chg`, termasuk seri chart yang konsisten
  - Fetch paralel (8 worker), cache 1 jam
  - **Gotcha:** FRED/Akamai menahan request dengan UA browser dari klien
    non-browser sampai timeout. UA `curl/8.7.1` dilayani normal → dipakai.
- `backend/app/routers/macro.py`
  - `GET /api/macro`, `/api/macro/series?ids=...`, `/api/macro/series/{id}`,
    `/api/macro/catalog`
  - Balas 502 kalau tidak ada indikator
- `src/pages/MacroPage.jsx` + route `/macro` + menu sidebar
  - Kartu per kelompok, sparkline, chart seri terpilih, cache/updated info

### 3.4 Berita global

- `backend/app/services/news.py`
  - RSS baru: `crypto`, `us`, `macro`, `geopolitik`
  - Alias kategori lama (`market` → `us`, `ekbis` → `macro`)
  - `COMPANY_NAMES` saham AS + kripto
  - Sentimen Indonesia + Inggris, scope dampak ke aset/sektor/pasar
  - Impact menyediakan key `asset` (kompatibel dengan `ihsg` lama)
- `src/pages/NewsPage.jsx`, `NewsImpactPage.jsx`: kategori baru

### 3.5 Frontend

- `src/hooks/useMarketIndex.js` (baru) + `useIHSG.js` jadi alias S&P 500
- `src/api/client.js`: `marketIndex`, `marketAssets`, `tickers(kind)`,
  `macro`, `macroSeries`
- `src/api/adapter.js`: `kind`, `currency`, profil pasar untuk kripto/ETF,
  logo dari backend
- `src/components/ui/DashboardComponents.jsx`: `fmtPrice()`, `kindLabel()`,
  `fmt()` pakai locale `en-US`
- Halaman: Dashboard, Screener (filter Semua/Saham AS/ETF/Kripto), Market,
  Market Pulse, Watchlist, Portfolio (USD), Stock Detail (profil pasar
  untuk kripto/ETF)
- Branding selesai: `index.html`, Sidebar, Splash, Topbar (S&P 500),
  AuthPage, template email OTP

### 3.6 Auth & perbaikan lokal

- `src/api/auth.js`: error jaringan sekarang jelas
  (“Tidak bisa terhubung ke backend …”), bukan “Failed to fetch”
- `backend/app/services/auth.py`
  - Fix `maybe_single()` yang mengembalikan `None` (penyebab login selalu 401/500)
  - Error DB tidak lagi disamarkan menjadi “Email atau password salah”
  - Branding email OTP → PULSETERMINAL
- `backend/requirements.txt`: tambah `requests`
- `.env.example`: lengkapi `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- `README.md`: instruksi `uvicorn --env-file .env`

---

## 4. Verifikasi terakhir

```text
npm run build            ✓ sukses
npm run lint             ✓ 0 error (4 warning lama di StockDetailPage)
python -m compileall app ✓ sukses
GET  /api/health         ✓ {"status":"ok"}
GET  /api/tickers        ✓ 60 aset (40 US, 10 ETF, 10 kripto)
GET  /api/stocks?kind=us_stock  ✓ 40 saham AS
GET  /api/stocks?kind=crypto    ✓ 10 kripto
GET  /api/stocks?kind=etf      ✓ 10 ETF
GET  /api/macro          ✓ 12 indikator FRED
POST /api/auth/login     ✓ 401 untuk user tidak ada (bukan 500)
FRED live fetch          ✓ ~0.5s
```

---

## 5. File baru

```
backend/app/routers/macro.py
backend/app/services/macro.py
src/hooks/useMarketIndex.js
src/pages/MacroPage.jsx
```

File yang berubah: 33 file (lihat `git status`). Total diff terakhir
±1.486 insertions / 674 deletions. **Belum di-commit.**

---

## 6. Lanjutan yang disarankan

1. **Tes login di browser** (`localhost:5173`) dengan akun asli.
2. **Restart `npm run dev`** agar `VITE_SUPABASE_*` terbaca (Google + realtime).
3. **Commit** semua perubahan (termasuk `PROGRESS.md`).
4. **Deploy ulang** backend + frontend ke Vercel supaya production tidak lagi
   versi IDX. Env production sudah ada (sensitive), tidak perlu diubah.
5. Opsional: isi `RESEND_API_KEY` di `backend/.env` untuk OTP email lokal.
   Tanpa itu, kode OTP tercetak di log backend (`[auth] RESEND_API_KEY kosong …`).
6. Opsional: bersihkan komponen legacy yang tidak dipakai —
   `src/components/dashboard/MarketChart.jsx`, `src/components/charts/IHSGChart.jsx`,
   `src/components/dashboard/StockTable.jsx`, `src/components/screener/ScreenerTable.jsx`,
   `src/components/screener/ScreenerFilters.jsx`, `src/data/appData.js`.
7. Opsional: pakai Supabase project terpisah untuk dev agar data production aman.

---

## 7. Gotchas

- `vercel env pull` **tidak** mengembalikan env sensitive — nilainya hanya
  `"[SENSITIVE]"`.
- FRED harus diakses dengan UA `curl/…`; UA browser dari Python timeout.
- Yahoo `debtToEquity` dalam persen, bukan rasio.
- Supabase `maybe_single().execute()` → `None` jika 0 baris (versi baru).
- Backend dev memakai DB production; hati-hati saat tes portfolio/watchlist.
- File `backend/.env` dan `.env.local` berisi secret, keduanya gitignored.
