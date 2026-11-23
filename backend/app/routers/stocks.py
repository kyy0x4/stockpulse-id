from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app.services.market import fetch_info, fetch_market_index
from app.data.tickers import (
    NEW_ASSETS,
    NEW_ASSET_TICKERS,
    NEW_SECTOR_GROUPS,
    MARKET_ASSETS,
)
from app.services.cache import get, set as cache_set
from app.services.jsonutil import sanitize
from app.services.news import COMPANY_NAMES, fetch_news
import app.services.analysis_runner as runner

router = APIRouter(prefix="/api", tags=["stocks"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/debug/clear-cache")
def clear_cache():
    """Debug endpoint to clear all cached data - use in development only."""
    from app.services.cache import invalidate
    invalidate()
    return {"cleared": True}


@router.post("/debug/clean-idx")
def clean_idx_stocks():
    """Remove Indonesian IDX stocks from Supabase database."""
    # List of Indonesian tickers to remove
    IDX_TICKERS = [
        "BBCA", "BBRI", "TLKM", "ASII", "UNVR", "PTBA", "ICBP", "ANTM",
        "HMSP", "SMGR", "CPIN", "BBNI", "BBTN", "ADRO", "AHLS", "AMRT",
        "ANJT", "ASDM", "BIAN", "BKPM", "BSND", "BTPA", "CCXI", "CDXA",
        "CNIJ", "DEVT", "DMKT", "DOID", "EMTB", "ENJM", "FORT", "GEMA",
        "GGGR", "HLRM", "HRUM", "ICBC", "IDFN", "IKAN", "INDR", "ITMG",
        "JRPT", "KATSI", "KBRI", "KPSI", "LPCX", "LPPKP", "MAIR", "MLSI",
        "MPDC", "MTMA", "MYTO", "NDARA", "PTBA", "PGAS", "PKPK", "PNBS",
        "POWR", "RBCA", "RMPL", "SAND", "SEIG", "SMLM", "SMRA", "SOPA",
        "STTP", "SYAK", "TLKM", "TIMA", "TIRT", "TLKM", "TYRA", "VBCA",
        "VGSI", "VICI", "VICI", "WATA", "WPMG", "XLAF", "XLK", "YMDB",
    ]
    
    try:
        from app.services import supabase as db
        import re
        
        removed = 0
        for ticker in set(IDX_TICKERS):  # unique
            try:
                db.client.table("quotes").delete().eq("ticker", ticker.upper()).execute()
                removed += 1
            except Exception:
                pass
        
        return {"message": f"Removed {removed} Indonesian tickers from database", "tickers": list(set(IDX_TICKERS))}
    except Exception as e:
        return {"error": str(e)}


@router.post("/debug/reset-db")
def reset_database():
    """Clear all quotes from Supabase - will be rebuilt on next request."""
    try:
        from app.services import supabase as db
        
        count = db.client.table("quotes").select("ticker", count="exact").execute()
        total = count.count if hasattr(count, 'count') else 'unknown'
        
        db.client.table("quotes").delete().neq("ticker", "").execute()
        
        return {"message": f"Cleared {total} records from database"}
    except Exception as e:
        return {"error": str(e)}


@router.get("/market/index")
def market_index(code: str = "SPX", period: str = "1y"):
    """Riwayat & snapshot indeks pasar (S&P 500, Nasdaq, Dow) atau kripto utama."""
    key = f"market:index:{code}:{period}"
    cached = get(key)
    if cached is None:
        cached = sanitize(fetch_market_index(code=code, period=period))
        if cached is not None:
            cache_set(key, cached, ttl=600)
    if cached is None:
        raise HTTPException(502, f"Gagal mengambil data indeks {code} dari Yahoo Finance")
    return JSONResponse(cached, headers={"Cache-Control": "public, max-age=300, s-maxage=300"})


@router.get("/market/assets")
def market_assets():
    """Daftar indeks/aset pasar yang tersedia untuk chart."""
    return {"assets": MARKET_ASSETS}


@router.get("/market/ihsg")
def ihsg():
    """Kompatibilitas endpoint lama — sekarang menampilkan S&P 500."""
    return market_index(code="SPX")


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
def tickers(kind: Optional[str] = None):
    """Daftar universe baru: saham AS/ETF + kripto spot."""
    items = [
        {
            "ticker": code,
            "name": meta.get("name") or code,
            "sector": meta.get("sector") or "Lainnya",
            "kind": meta.get("kind"),
        }
        for code, meta in sorted(NEW_ASSETS.items())
        if kind is None or meta.get("kind") == kind
    ]
    return {"total": len(items), "tickers": items, "sectors": NEW_SECTOR_GROUPS}


def _looks_complete(s):
    """True kalau snapshot Supabase punya data fundamental yang layak tampil.

    Snapshot lama bisa berisi baris hasil build yang gagal (sector "Lainnya",
    market cap "—"). Kalau begitu lebih baik rebuild dari Yahoo daripada
    menyajikan data kosong.
    """
    if not s.get("kind"):
        return False
    if s.get("kind") == "us_stock":
        sector = (s.get("sector") or "").strip()
        if sector in ("", "Lainnya"):
            return False
    return True


@router.get("/stocks")
def list_stocks(
    sector: Optional[str] = None,
    signal: Optional[str] = None,
    min_score: Optional[int] = None,
    q: Optional[str] = None,
    kind: Optional[str] = None,
    limit: int = Query(240, le=300),
):
    cached = get("screen:all")
    if cached is not None:
        results = [s for s in cached if _matches(s, sector, signal, min_score, q, kind)]
    else:
        # cold start: coba baca snapshot terakhir dari Supabase dulu (cepat),
        # baru fallback build dari Yahoo.
        results = None
        try:
            from app.services import supabase as db
            quotes = db.fetch_quotes(limit=400)
            if quotes:
                merged = [dict(s, **(s.get("payload") or {})) for s in quotes]
                if all(_looks_complete(s) for s in merged[:20]):
                    results = [s for s in merged if _matches(s, sector, signal, min_score, q, kind)]
        except Exception:
            pass
        if results is None:
            results = runner.build_all()
            cache_set("screen:all", sanitize(results), ttl=600)

    results.sort(key=lambda s: (s["composite"] if s["composite"] is not None else -1), reverse=True)
    body = {"total": len(results), "stocks": sanitize(results[:limit])}
    return JSONResponse(body, headers={"Cache-Control": "public, max-age=300, s-maxage=300"})


def _matches(s, sector, signal, min_score, q, kind=None):
    # Data must have a valid 'kind' field (us_stock, etf, or crypto)
    # IDX stocks won't have this field and should be excluded
    s_kind = s.get("kind")
    if s_kind is None:
        # Old IDX data without kind field - exclude it
        return False
    if kind and s_kind != kind:
        return False
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
    if code not in NEW_ASSET_TICKERS:
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
            # isi nama/sektor dari master statis untuk aset non-core
            cached = []
            for it in _items:
                related = []
                for r in it.get("related", []):
                    code = r["ticker"]
                    meta = master.get(code) or {}
                    static = NEW_ASSETS.get(code) or {}
                    related.append({
                        "ticker": code,
                        "name": meta.get("name") or static.get("name"),
                        "sector": meta.get("sector") or static.get("sector"),
                        "price": meta.get("price"),
                        "change": meta.get("change"),
                        "direction": r.get("direction"),
                        "note": r.get("note"),
                    })
                cached.append({**it, "related": related})
        except Exception as exc:
            raise HTTPException(502, f"Gagal mengambil berita: {exc}")
        cache_set(f"news:{category}", cached, ttl=300)
    return JSONResponse({"category": category, "total": len(cached), "items": cached}, headers={"Cache-Control": "public, max-age=300, s-maxage=300"})