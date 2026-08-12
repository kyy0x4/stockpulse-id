"""Koleksi logo saham IDX: unduh dari icon.horse (domain via Yahoo) → public/logos/{TICKER}.png.

Jalankan sekali (atau saat mau refresh logo):
  cd backend && .venv/bin/python -m scripts_collect_logos
"""
import os
import sys
import time
import urllib.request

from app.data.tickers import ALL_TICKERS, LOGO_OVERRIDES
from app.services.market import fetch_info

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "logos")
UA = {"User-Agent": "Mozilla/5.0 (StockPulse ID logo collector)"}

# domain tidak berubah cepat, cache supaya tidak ganti-ganti
DOMAIN_CACHE = {}


def get_domain(ticker):
    try:
        info = fetch_info(ticker)
        return info.get("domain")
    except Exception:
        return None


def download(url, dest):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = res.read()
            if len(data) < 300:
                return False
            if (res.headers.get("Content-Type") or "").startswith("image"):
                with open(dest, "wb") as f:
                    f.write(data)
                return True
    except Exception:
        pass
    return False


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    got = 0
    missed = []
    for ticker in sorted(ALL_TICKERS):
        dest = os.path.join(OUT_DIR, f"{ticker}.png")
        if os.path.exists(dest) and os.path.getsize(dest) > 500:
            got += 1
            continue
        domain = None
        for attempt in range(3):
            domain = get_domain(ticker)
            if domain:
                break
            time.sleep(0.4)
        if not domain:
            missed.append((ticker, "no-domain"))
            continue
        ok = download(f"https://icon.horse/icon/{domain}", dest)
        time.sleep(0.15)
        if ok:
            got += 1
        else:
            missed.append((ticker, domain))
        print(f"{ticker}: {'OK' if ok else 'MISS'} {domain}")
    print(f"\nSelesai: {got} logo, {len(missed)} gagal")
    for m in missed:
        print("  -", m)
    return 0 if not missed else 1


if __name__ == "__main__":
    sys.exit(main())