"""Integrasi Supabase untuk penyimpanan & push harga realtime.

Design: backend tiap menit (saat jam bursa) mengambil history batch dari Yahoo,
menghitung analisa, lalu **upsert** ke tabel `stock_quotes` di Supabase.
Perubahan tabel tersebut otomatis dipush lewat Supabase Realtime ke frontend
(websocket), sehingga harga tampil near-realtime tanpa reload.

Jika env SUPABASE_URL / SUPABASE_SERVICE_KEY tidak ada (mis. dev lokal tanpa
Supabase), semua fungsi jadi no-op yang aman — app tetap berjalan seperti biasa.
"""

import os

from app.services.jsonutil import sanitize

URL = os.getenv("SUPABASE_URL", "").strip()
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "").strip()

SUPABASE_CLIENT = None
if URL and SERVICE_KEY:
    try:
        from supabase import create_client as _create

        SUPABASE_CLIENT = _create(URL, SERVICE_KEY)
    except Exception as exc:
        print(f"[supabase] init client gagal: {exc}")


def _client():
    global SUPABASE_CLIENT
    if SUPABASE_CLIENT is None:
        from supabase import create_client

        SUPABASE_CLIENT = create_client(URL, SERVICE_KEY)
    return SUPABASE_CLIENT


def available():
    return bool(URL and SERVICE_KEY)


def upsert_quotes(items):
    """Bulk upsert snapshot harga ke stock_quotes.

    items: list hasil build_all (dict lengkap). Kolom payload menyimpan seluruh
    dict (sudah JSON-safe) supaya frontend tidak butuh fetch ulang per saham.
    """
    if not available() or not items:
        return 0
    rows = [
        {
            "ticker": i.get("ticker"),
            "name": i.get("name"),
            "sector": i.get("sector"),
            "price": i.get("price"),
            "change": i.get("change"),
            "volume": i.get("volume"),
            "market_cap": i.get("market_cap"),
            "per": i.get("per"),
            "pbv": i.get("pbv"),
            "composite": i.get("composite"),
            "signal": i.get("signal"),
            "payload": sanitize({k: v for k, v in i.items() if k != "payload"}),
            "updated_at": "now()",
        }
        for i in items
    ]
    try:
        res = _client().table("stock_quotes").upsert(rows, on_conflict="ticker").execute()
        n = len(res.data or [])
        return n
    except Exception as exc:
        print(f"[supabase] upsert_quotes gagal: {exc}")
        return 0


def fetch_quotes(limit=None):
    """Baca snapshot terbaru dari Supabase (fallback cold-start / validasi)."""
    if not available():
        return None
    try:
        q = _client().table("stock_quotes").select("*").order("composite", desc=True).limit(limit or 300)
        res = q.execute()
        return res.data or []
    except Exception as exc:
        print(f"[supabase] fetch_quotes gagal: {exc}")
        return None


def upsert_history(ticker, rows):
    """Simpan baris history (list dict ber-date/close) ke stock_history."""
    if not available() or not rows:
        return 0
    prepared = [
        {
            "ticker": ticker,
            "date": r["date"][:10],
            "open": r.get("open"),
            "high": r.get("high"),
            "low": r.get("low"),
            "close": r.get("close"),
            "volume": r.get("volume"),
        }
        for r in rows
    ]
    try:
        res = _client().table("stock_history").upsert(prepared, on_conflict="ticker,date").execute()
        return len(res.data or [])
    except Exception as exc:
        print(f"[supabase] upsert_history {ticker} gagal: {exc}")
        return 0


def record_session(session_date, status="open", pushed=0):
    if not available():
        return
    try:
        _client().table("market_sessions").upsert(
            {"session_date": str(session_date), "status": status, "pushed_count": pushed},
            on_conflict="session_date",
        ).execute()
    except Exception as exc:
        print(f"[supabase] record_session gagal: {exc}")


def get_session(session_date):
    if not available():
        return None
    try:
        res = _client().table("market_sessions").select("*").eq("session_date", str(session_date)).execute()
        return res.data[0] if res.data else None
    except Exception as exc:
        print(f"[supabase] get_session gagal: {exc}")
        return None