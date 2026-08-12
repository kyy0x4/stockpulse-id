"""Cron job: pre-warm cache & refresh data saham harian.

Dijalankan otomatis via Render Cron setiap 17:00 WIB (10:00 UTC, Senin-Jumat) —
setelah perdagangan bursa tutup. Mengambil ulang semua harga dan memanaskan
cache sehingga UI loading cepat.
"""

import os
import sys


def run():
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
    from app.services.analysis_runner import build_all
    from app.services.cache import invalidate, set as cache_set

    print("[refresh] invalidating cache...")
    invalidate()

    print("[refresh] fetching all tickers...")
    results = build_all()

    print(f"[refresh] done, {len(results)} stocks ready")
    cache_set("screen:all", results, ttl=60 * 60 * 6)
    print("[refresh] cache warmed for 6h")


if __name__ == "__main__":
    run()