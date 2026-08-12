# StockPulse ID

Platform web untuk analisa fundamental & teknikal saham Indonesia untuk investasi jangka panjang.

## Stack

**Frontend** — React 19 + Vite 8 + Tailwind CSS 4 + Framer Motion + Recharts
**Backend** — FastAPI + yfinance (data real saham IDX, suffix `.JK`)
**Deploy** — Render (API) + Netlify/Vercel (frontend), keduanya free tier

## Struktur

```
├── backend/           # FastAPI + engine analisa
│   ├── app/
│   │   ├── data/      # daftar ticker IDX, mapping sektor
│   │   ├── routers/   # endpoint API
│   │   ├── services/  # fetch yfinance, analisa, scoring, cache
│   │   └── jobs/      # cron refresh harian (pre-warm cache)
│   ├── Dockerfile     # image utk Render
│   └── entrypoint.sh  # jalankan API atau cron job
├── src/               # frontend React
│   ├── api/           # client API + adapter (backend → komponen)
│   ├── components/    # ui/ dashboard/ screener/ charts/ layout
│   ├── pages/         # Dashboard, Screener, Watchlist, Market, Detail
│   └── hooks/         # useStocks (fetch + fallback mock)
├── render.yaml        # config deploy Render (API + cron)
├── netlify.toml       # config deploy Netlify
└── .env.example       # contoh env VITE_API_BASE
```

## Run Lokal

```bash
# 1. Backend (port 8000)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --port 8000

# 2. Frontend (port 5173) — terminal lain
npm install
npm run dev

# 3. Buka http://localhost:5173
```

> Frontend otomatis pakai data mock kalau backend tidak terhubung (badge "mode demo").

## Deploy (gratis)

### 1. Backend → Render (free tier)

1. Push repo ke GitHub.
2. Masuk [render.com](https://render.com) → **New → Blueprint** → pilih repo.
3. Render membaca `render.yaml` otomatis dan membuat **StockPulse API** (web service free, health check `/api/health`).
4. Tunggu build selesai, dapat URL seperti `https://stockpulse-api.onrender.com`.
5. Tes: buka `https://stockpulse-api.onrender.com/api/health`.

> **Catatan cron:** Render cron tidak punya free plan (min `starter`). Sebagai gantinya, API punya endpoint `/api/warm` yang memanaskan cache secara asinkron. Pasang **UptimeRobot** (gratis) untuk ping `https://stockpulse-api.onrender.com/api/warm` tiap 5 menit — ini mencegah service free tier tertidur (idle suspend >15 menit) sekaligus memastikan data selalu hangat saat user datang.

### 2. Frontend → Netlify (free tier)

1. Di Render copy URL API. Ganti env di Netlify: **VITE_API_BASE** = `https://stockpulse-api.onrender.com/api`
2. Netlify → **Add new site → Import from Git** → pilih repo.
3. Build command: `npm run build` · Publish directory: `dist` (otomatis dari `netlify.toml`).
4. Deploy, dapat URL `https://stockpulse-id.netlify.app`.

> Atau pakai Vercel: import repo, set `VITE_API_BASE`, deploy.

### UptimeRobot (gratis) — jaga API tetap hangat

1. Daftar [uptimerobot.com](https://uptimerobot.com) (free: 50 monitor).
2. **Add New Monitor** → type **HTTP(s)** → URL `https://stockpulse-api.onrender.com/api/warm`.
3. Interval `5 menit`.
4. Selesai. API gak pernah tidur, cache selalu fresh.

## Design System

Gaya **Dark Mode (OLED)** + aksen hijau finansial, font **Fira Code/Fira Sans**, dibuat dengan skill UI UX Pro Max.

## API

```
GET /api/health              → status
GET /api/warm                → keep-alive + pre-warm cache (untuk monitor gratis)
GET /api/tickers             → daftar ticker + sektor
GET /api/stocks?filter=...   → screener (sector, signal, min_score, q, limit)
GET /api/stocks/BBCA         → detail + history 90 hari + analisa
```

Docs interaktif: `http://localhost:8000/docs`

> Data fundamental saat ini berasal dari summary Yahoo Finance. Untuk laporan keuangan detail per triwulanan (scrape IDX) bisa ditambahkan sebagai komponen analisa fundamental selanjutnya.