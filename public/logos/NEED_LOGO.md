# Logo Saham (TradingView SVG)

Logo di folder ini otomatis dipakai frontend dengan nama file **`{TICKER}.svg`**
(contoh: `public/logos/BBCA.svg`, `public/logos/ANTM.svg`). Saat ini **798 emiten**
dari 934 sudah punya logo resmi yang diambil dari **TradingView**
(`s3-symbol-logo.tradingview.com`) via `backend/scripts_collect_logos.py`.

Frontend memakai logo lokal `/logos/{TICKER}.svg`; jika file tidak ada, app
fallback ke logo remote override (konfigurasi `LOGO_OVERRIDES`) lalu inisial
bergradasi — jadi app tidak pernah rusak tanpa logo.

## Refresh logo (jika tutorial berubah / emiten baru)

```bash
cd backend
.venv/bin/python scripts_collect_logos.py
```

Script ini memungut `logoid` seluruh emiten IDX (843) sekaligus dari API
scanner TradingView, lalu mengunduh SVG-nya secara paralel ke `public/logos/`.
Map `{ticker → logoid}` juga disimpan di `public/logos/_tradingview.json`
sebagai referensi tanpa perlu hit API lagi.

## Emiten tanpa logo di TradingView

135 emiten tidak ada di TradingView (kebanyakan delisting/suspensi/daftar lama).
Untuk menambah logo manual untuk salah satunya, simpan file `{TICKER}.svg` di
folder ini (SVG/PNG, background transparan), commit & deploy.

> Nama file HANYA boleh diakhiri `.svg` atau `.png` sesuai extension asli file.