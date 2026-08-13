from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app.services.market import fetch_info, fetch_ihsg
from app.data.tickers import ALL_TICKERS, FULL_EMITEN, SECTOR_GROUPS
from app.services.cache import get, set as cache_set
from app.services.jsonutil import sanitize
from app.services.news import COMPANY_NAMES, fetch_news
import app.services.analysis_runner as runner

router = APIRouter(prefix="/api", tags=["stocks"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/market/ihsg")
def ihsg():
    cached = get("market:ihsg")
    if cached is None:
        cached = sanitize(fetch_ihsg(period="1y"))
        cache_set("market:ihsg", cached, ttl=600)
    if cached is None:
        raise HTTPException(502, "Gagal mengambil data IHSG dari Yahoo Finance")
    return JSONResponse(cached, headers={"Cache-Control": "public, max-age=300, s-maxage=300"})


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
        cache_set("screen:all", sanitize(results), ttl=60 * 60 * 6)
        try:
            from app.services import supabase as db
            db.upsert_quotes(results)
        except Exception:
            pass
    except Exception:
        pass
    finally:
        _building = False


@router.get("/tickers")
def tickers():
    all_emiten = [
        {"ticker": code, "name": meta["name"], "sector": meta["sector"]}
        for code, meta in sorted(FULL_EMITEN.items())
    ]
    return {"total": len(all_emiten), "tickers": all_emiten, "sectors": SECTOR_GROUPS}


@router.get("/stocks")
def list_stocks(
    sector: Optional[str] = None,
    signal: Optional[str] = None,
    min_score: Optional[int] = None,
    q: Optional[str] = None,
    limit: int = Query(240, le=300),
):
    cached = get("screen:all")
    if cached is not None:
        results = [s for s in cached if _matches(s, sector, signal, min_score, q)]
    else:
        # cold start: coba baca snapshot terakhir dari Supabase dulu (cepat),
        # baru fallback build dari Yahoo.
        results = None
        try:
            from app.services import supabase as db
            quotes = db.fetch_quotes(limit=400)
            if quotes:
                results = [s for s in quotes if _matches(s, sector, signal, min_score, q)]
        except Exception:
            pass
        if results is None:
            results = runner.build_all()
            cache_set("screen:all", sanitize(results), ttl=600)

    results.sort(key=lambda s: (s["composite"] if s["composite"] is not None else -1), reverse=True)
    body = {"total": len(results), "stocks": sanitize(results[:limit])}
    return JSONResponse(body, headers={"Cache-Control": "public, max-age=300, s-maxage=300"})


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
    if code not in ALL_TICKERS and code not in FULL_EMITEN:
        raise HTTPException(404, f"Ticker {code} tidak ditemukan")
    try:
        return sanitize(runner.get_stock_detail(code))
    except Exception as exc:
        raise HTTPException(500, f"Gagal mengambil data {code}: {exc}")


@router.get("/news")
def news(category: str = "market", limit: int = Query(20, le=50)):
    cached = get(f"news:{category}")
    if cached is None:
        try:
            _items = fetch_news(category=category, limit=limit)
            # Lengkapi ticker terkait dengan nama & sektor dari data master (cache screen:all)
            master = {}
            master_cached = get("screen:all")
            if master_cached:
                for s in master_cached:
                    code = s.get("ticker")
                    if code and s.get("name"):
                        master[code] = {
                            "name": s.get("name"),
                            "sector": s.get("sector"),
                            "price": s.get("price"),
                            "change": s.get("change"),
                        }
            # isi nama/sektor dari master statis utk emiten non-core (934)
            cached = []
            for it in _items:
                related = []
                for r in it.get("related", []):
                    code = r["ticker"]
                    meta = master.get(code) or {}
                    em = FULL_EMITEN.get(code) or {}
                    related.append({
                        "ticker": code,
                        "name": meta.get("name") or em.get("name"),
                        "sector": meta.get("sector") or em.get("sector"),
                        "price": meta.get("price"),
                        "change": meta.get("change"),
                    })
                cached.append({**it, "related": related})
        except Exception as exc:
            raise HTTPException(502, f"Gagal mengambil berita: {exc}")
        cache_set(f"news:{category}", cached, ttl=300)
    return JSONResponse({"category": category, "total": len(cached), "items": cached}, headers={"Cache-Control": "public, max-age=300, s-maxage=300"})