"""Cron endpoints untuk polling intraday & end-of-day.

Polling tiap menit (sesi NYSE dalam WIB; kripto 24/7) → refresh cache +
upsert ke Supabase, sehingga perubahan tabel stock_quotes dipush realtime
ke frontend. EOD setelah sesi AS tutup → simpan bar harian ke stock_history.

Dijadwalkan gratis via **Supabase Scheduled Functions** (pg_cron) atau
cron-job.org/UptimeRobot — lihat README.
"""

from datetime import datetime, time, timedelta

from fastapi import APIRouter

from app.data.tickers import NEW_ASSET_TICKERS
from app.services import supabase as db
from app.services.cache import get, set as cache_set
from app.services.jsonutil import sanitize
from app.services.market import fetch_batch_histories
import app.services.analysis_runner as runner

router = APIRouter(prefix="/api/cron", tags=["cron"])

WIB = 7  # UTC offset jam
# Sesi saham AS dalam WIB (NYSE 09:30–16:00 ET)
US_START = time(21, 30)
US_END = time(4, 0)
# Kripto diperdagangkan 24/7, jadi polling tidak pernah benar-benar tutup.
CRYPTO_ALWAYS = True


def _wib_now():
    return datetime.utcnow() + timedelta(hours=WIB)


def _is_weekday(dt):
    return dt.weekday() < 5


def _us_market_open(dt):
    """Sesi saham AS (09:30–16:00 ET) dikonversi ke WIB (UTC+7)."""
    t = dt.time()
    if dt.weekday() < 5 and t >= US_START:
        return True
    # 00:00–04:00 WIB = sore hari sebelumnya di ET
    if dt.weekday() < 6 and t <= US_END:
        return True
    return False


def _poll_async():
    """Refresh data & push ke Supabase tanpa memblokir request cron."""
    try:
        results = runner.build_all()
        if not results:
            return
        cache_set("screen:all", sanitize(results), ttl=60 * 60 * 2)
        db.upsert_quotes(results)
        # Cek alerts yang tembus & tandai triggered
        from app.routers import alerts as alerts_router
        hits = alerts_router.check_alerts(results)
        for user_id, al, quote in hits:
            ticker = al.get("ticker")
            msg = (f"Alert {ticker} tembus: {al.get('type')} "
                   f"{'harga=' + str(quote.get('price')) if al.get('type').startswith('price_') else 'sinyal=' + str(quote.get('signal'))}")
            print(f"[alerts] {user_id} <- {msg}")
            # TODO: kirim email/push ke user_id (via Resend/Telegram)
        print(f"[cron] pushed {len(results)} quotes, {len(hits)} alerts triggered")
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

        histories = fetch_batch_histories(NEW_ASSET_TICKERS, period="1y")
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
    """Dipanggil tiap ~1 menit. Kripto 24/7; saham AS mengikuti sesi NYSE."""
    now = _wib_now()
    us_open = _us_market_open(now)
    if not CRYPTO_ALWAYS and not us_open:
        return {"polled": False, "reason": "off-hours", "us_market_open": us_open, "wib": now.isoformat()}

    import threading
    threading.Thread(target=_poll_async, daemon=True).start()
    return {"polled": True, "us_market_open": us_open, "wib": now.isoformat()}


@router.get("/eod")
def cron_eod():
    """Dipanggil setelah sesi AS tutup: simpan history + quotes final."""
    now = _wib_now()
    if not _us_market_open(now):
        return {"eod": False, "reason": "off-hours", "wib": now.isoformat()}

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
        "us_market_open": _us_market_open(dt),
        "crypto_market_open": True,
        "supabase": bool(db.available()),
        "quotes_in_supabase": quotes_count,
        "history_rows_in_supabase": history_count,
    }