from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.market import fetch_info
from app.data.tickers import ALL_TICKERS, SECTOR_GROUPS
from app.services.cache import get, set as cache_set
import app.services.analysis_runner as runner

router = APIRouter(prefix="/api", tags=["stocks"])


@router.get("/health")
def health():
    return {"status": "ok"}


_building = False


@router.get("/warm")
def warm():
    """Keep-alive endpoint (dipanggil UptimeRobot/monitor tiap 5 menit).

    Render free tier akan mem-buff (sleep) service yang idle >15 menit.
    Endpoint ini juga memastikan cache saham sudah hangat sebelum user datang.
    """
    global _building
    from app.services.cache import get
    cached = get("screen:all")
    if cached is not None:
        return {"warmed": True, "cached": True, "stocks": len(cached)}

    if _building:
        return {"warmed": True, "cached": False, "building": True, "note": "already building"}

    _building = True
    import threading
    t = threading.Thread(target=_warm_async, daemon=True)
    t.start()
    return {"warmed": True, "cached": False, "building": True}


def _warm_async():
    global _building
    from app.services.cache import set as cache_set
    try:
        results = runner.build_all()
        cache_set("screen:all", results, ttl=60 * 60 * 6)
    except Exception:
        pass
    finally:
        _building = False


@router.get("/tickers")
def tickers():
    return {"total": len(ALL_TICKERS), "tickers": ALL_TICKERS, "sectors": SECTOR_GROUPS}


@router.get("/stocks")
def list_stocks(
    sector: Optional[str] = None,
    signal: Optional[str] = None,
    min_score: Optional[int] = None,
    q: Optional[str] = None,
    limit: int = Query(30, le=100),
):
    cached = get("screen:all")
    if cached is not None:
        results = [s for s in cached if _matches(s, sector, signal, min_score, q)]
    else:
        results = runner.build_all()
        cache_set("screen:all", results, ttl=600)

    results.sort(key=lambda s: (s["composite"] if s["composite"] is not None else -1), reverse=True)
    return {"total": len(results), "stocks": results[:limit]}


def _matches(s, sector, signal, min_score, q):
    if sector and s["sector"] != sector:
        return False
    if signal and s["signal"] != signal:
        return False
    if min_score and (s["composite"] is None or s["composite"] < min_score):
        return False
    if q and q.upper() not in s["ticker"] and q.lower() not in (s["name"] or "").lower():
        return False
    return True


@router.get("/stocks/{ticker}")
def stock_detail(ticker: str):
    code = ticker.upper()
    if code not in ALL_TICKERS:
        raise HTTPException(404, f"Ticker {code} tidak ditemukan")
    try:
        return runner.get_stock_detail(code)
    except Exception as exc:
        raise HTTPException(500, f"Gagal mengambil data {code}: {exc}")