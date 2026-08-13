"""Cron endpoints untuk polling intraday & end-of-day.

Polling tiap menit (jam bursa WIB) → refresh cache + upsert ke Supabase,
sehingga perubahan tabel stock_quotes dipush realtime ke frontend.
EOD 15:55 WIB → simpan bar harian ke stock_history.

Dijadwalkan gratis via **Supabase Scheduled Functions** (pg_cron) atau
cron-job.org/UptimeRobot — lihat README.
"""

from datetime import datetime, time, timedelta

from fastapi import APIRouter

from app.data.tickers import ALL_TICKERS
from app.services import supabase as db
from app.services.cache import get, set as cache_set
from app.services.jsonutil import sanitize
from app.services.market import fetch_batch_histories
import app.services.analysis_runner as runner

router = APIRouter(prefix="/api/cron", tags=["cron"])

WIB = 7  # UTC offset jam
STOCK_FULL_START = time(9, 0)    # 09:00 WIB
STOCK_FULL_END = time(15, 55)    # 15:55 WIB
EOD_HOUR = time(15, 50)          # mulai proses akhir 15:50 WIB


def _wib_now():
    return datetime.utcnow() + timedelta(hours=WIB)


def _is_weekday(dt):
    return dt.weekday() < 5


def _position(dt):
    return dt.time()


def _poll_async():
    """Refresh data & push ke Supabase tanpa memblokir request cron."""
    try:
        results = runner.build_all()
        if not results:
            return
        cache_set("screen:all", sanitize(results), ttl=60 * 60 * 2)
        db.upsert_quotes(results)
        print(f"[cron] pushed {len(results)} quotes")
    except Exception as exc:
        print(f"[cron] poll gagal: {exc}")


def _eod_async():
    """Proses akhir sesi: simpan bar harian & pastikan quotes final di Supabase."""
    try:
        dt = _wib_now().date()
        session = db.get_session(dt)
        if session and session.get("status") == "eod_pushed":
            print("[cron] eod sudah dipush, skip")
            return

        if not db.available():
            # tetap hangatkan cache in-memory
            results = runner.build_all()
            cache_set("screen:all", sanitize(results), ttl=60 * 60 * 2)
            db.record_session(dt, "eod_pushed", 0)
            print(f"[cron] eod (tanpa supabase): {len(results)} stocks")
            return

        histories = fetch_batch_histories(ALL_TICKERS, period="1y")
        pushed_hist = 0
        for ticker, rows in histories.items():
            pushed_hist += db.upsert_history(ticker, rows)

        results = runner.build_all()
        cache_set("screen:all", sanitize(results), ttl=60 * 60 * 2)
        pushed_quotes = db.upsert_quotes(results)
        db.record_session(dt, "eod_pushed", pushed_quotes)
        print(f"[cron] eod selesai: {pushed_hist} history rows, {pushed_quotes} quotes")
    except Exception as exc:
        print(f"[cron] eod gagal: {exc}")


@router.get("/poll")
def cron_poll():
    """Dipanggil tiap ~1 menit saat jam bursa. No-op di luar jam/minggu."""
    now = _wib_now()
    if not _is_weekday(now):
        return {"polled": False, "reason": "weekend", "wib": now.isoformat()}
    if not (STOCK_FULL_START <= _position(now) <= STOCK_FULL_END):
        return {"polled": False, "reason": "off-hours", "wib": now.isoformat()}

    import threading
    threading.Thread(target=_poll_async, daemon=True).start()
    return {"polled": True, "wib": now.isoformat()}


@router.get("/eod")
def cron_eod():
    """Dipanggil ~15:50 WIB tiap hari bursa: simpan history + quotes final."""
    now = _wib_now()
    if not _is_weekday(now):
        return {"eod": False, "reason": "weekend", "wib": now.isoformat()}

    import threading
    threading.Thread(target=_eod_async, daemon=True).start()
    return {"eod": True, "wib": now.isoformat()}


@router.get("/status")
def cron_status():
    dt = _wib_now()
    quotes_count = 0
    history_count = 0
    try:
        if db.available():
            quotes_count = len(db.fetch_quotes(limit=10000))
            from app.services.supabase import SUPABASE_CLIENT
            q = SUPABASE_CLIENT.table("stock_history").select("ticker", count="exact").limit(0)
            res = q.execute()
            history_count = (res.count or 0) if res else 0
    except Exception:
        pass
    return {
        "wib": dt.isoformat(),
        "weekday": _is_weekday(dt),
        "in_market_hours": _is_weekday(dt) and STOCK_FULL_START <= _position(dt) <= STOCK_FULL_END,
        "supabase": bool(db.available()),
        "quotes_in_supabase": quotes_count,
        "history_rows_in_supabase": history_count,
    }