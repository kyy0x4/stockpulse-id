"""Koleksi logo saham IDX dari TradingView → public/logos/{TICKER}.svg.

TradingView menyediakan logo resmi emiten via s3-symbol-logo.tradingview.com.
logoid diperoleh sekali pakai dari API scanner (843 emiten IDX), tanpa loop
per-ticker, lalu SVG diunduh paralel.

  cd backend && .venv/bin/python scripts_collect_logos.py
"""
import concurrent.futures as cf
import json
import os
import sys
import urllib.request

from app.data.tickers import FULL_EMITEN

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "logos")
MAP_JSON = os.path.join(OUT_DIR, "_tradingview.json")
SCAN_URL = "https://scanner.tradingview.com/indonesia/scan"
LOGO_BASE = "https://s3-symbol-logo.tradingview.com"
UA = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) PlotFinansial/1.0",
    "Content-Type": "application/json",
}


def fetch_logo_map():
    """Ambil {ticker: logoid} untuk semua saham IDX dari scanner TradingView."""
    payload = json.dumps({
        "symbols": {"tickers": [], "query": {"types": ["stock"]}},
        "columns": ["logoid", "name", "description", "type"],
        "range": [0, 2000],
    }).encode()
    req = urllib.request.Request(SCAN_URL, data=payload, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as res:
        data = json.loads(res.read().decode())
    return {
        row["d"][1]: row["d"][0]
        for row in data.get("data", [])
        if row.get("d", [None])[0]
    }


def download_logo(ticker, logoid):
    dest = os.path.join(OUT_DIR, f"{ticker}.svg")
    if os.path.exists(dest) and os.path.getsize(dest) > 200:
        return ticker, True, "cached"
    url = f"{LOGO_BASE}/{logoid}.svg"
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = res.read()
            if len(data) > 200:
                with open(dest, "wb") as f:
                    f.write(data)
                return ticker, True, logoid
    except Exception as exc:
        return ticker, False, str(exc)[:60]
    return ticker, False, "empty"


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Mengambil logoid dari scanner TradingView ...")
    logo_map = fetch_logo_map()
    print(f"  {len(logo_map)} emiten IDX ditemukan di TradingView.")

    # simpan map logoid utk fallback / validasi tanpa hit API lagi
    with open(MAP_JSON, "w") as f:
        json.dump(logo_map, f, indent=1, sort_keys=True)

    target = {k: v for k, v in logo_map.items() if k in FULL_EMITEN}
    print(f"  {len(target)} cocok dengan daftar emiten lokal; mulai unduh SVG ...")

    got = 0
    missed = []
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        futures = [ex.submit(download_logo, t, logoid) for t, logoid in sorted(target.items())]
        for fut in cf.as_completed(futures):
            ticker, ok, detail = fut.result()
            if ok:
                got += 1
            else:
                missed.append((ticker, detail))
            print(f"{ticker}: {'OK' if ok else 'MISS'} {detail}")

    print(f"\nSelesai: {got} logo SVG, {len(missed)} gagal")
    for m in missed:
        print("  -", m)
    return 0 if len(missed) == 0 else 1


if __name__ == "__main__":
    sys.exit(main())