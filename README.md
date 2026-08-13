# PlotFinansial

Platform web untuk analisa fundamental & teknikal saham Indonesia untuk investasi jangka panjang.

## Stack

**Frontend** — React 19 + Vite 8 + Tailwind CSS 4 + Framer Motion + Recharts
**Backend** — FastAPI + yfinance (data real saham IDX, suffix `.JK`)
**Deploy** — SnapDeploy (API) + Netlify/Vercel (frontend), keduanya free tier

## Struktur

```
├── backend/           # FastAPI + engine analisa
│   ├── app/
│   │   ├── data/      # daftar ticker IDX, mapping sektor
│   │   ├── routers/   # endpoint API
│   │   ├── services/  # fetch yfinance, analisa, scoring, cache
│   │   └── jobs/      # cron refresh harian (pre-warm cache)
│   ├── Dockerfile     # image utk Koyeb/Render
│   └── entrypoint.sh  # jalankan API atau cron job
├── src/               # frontend React
│   ├── api/           # client API + adapter (backend → komponen)
│   ├── components/    # ui/ dashboard/ screener/ charts/ layout
│   ├── pages/         # Dashboard, Screener, Watchlist, Market, Detail
│   └── hooks/         # useStocks (fetch + fallback mock)
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

### 1. Backend → Vercel (sudah live)

Backend FastAPI dideploy di Vercel sebagai Vercel Service (auto-detect dari `backend/app/main.py`), satu project dengan frontend. `vercel.json` mengatur routing `/api/*` ke backend dan `/*` ke frontend. Endpoint `/api/warm` memanaskan cache. Respons `/api/stocks` di-CDN (Cache-Control 300s) sehingga request pengguna <1 detik setelah warm.

### 2. Frontend → Vercel (sudah live)

Frontend di `https://stockpulse-id.vercel.app`, backend di path `/api` pada domain yang sama (Vercel rewrite). Tidak perlu `VITE_API_BASE` — di production `client.js` otomatis pakai `/api` relatif.

### UptimeRobot (opsional) — hapus cold start ~20s

Daftar [uptimerobot.com](https://uptimerobot.com) (free: 50 monitor) → **Add New Monitor** → type **HTTP(s)** → URL `https://stockpulse-id.vercel.app/api/warm`, interval `5 menit`. Ini mem-buffer cache CDN supaya user pertama gak nunggu 20 detik.

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