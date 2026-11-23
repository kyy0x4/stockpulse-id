from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app.services.cache import get
from app.services.jsonutil import sanitize
from app.services.macro import get_macro_snapshot, get_macro_series, SERIES

router = APIRouter(prefix="/api/macro", tags=["macro"])


@router.get("")
def macro_snapshot():
    """Indikator makro AS: inflasi, tenaga kerja, GDP, suku bunga, yield."""
    cached = get("macro:snapshot")
    if cached is None:
        cached = sanitize(get_macro_snapshot())
    if not cached.get("indicators"):
        raise HTTPException(502, "Gagal mengambil data makro dari FRED")
    return JSONResponse(cached, headers={"Cache-Control": "public, max-age=900, s-maxage=900"})


@router.get("/series")
def macro_series(ids: str = Query("CPIAUCSL,UNRATE,FEDFUNDS")):
    """Beberapa seri FRED sekaligus untuk chart."""
    wanted = [s.strip().upper() for s in ids.split(",") if s.strip()][:6]

    import concurrent.futures as cf
    with cf.ThreadPoolExecutor(max_workers=len(wanted) or 1) as pool:
        out = [item for item in pool.map(get_macro_series, wanted) if item]
    return JSONResponse({"series": sanitize(out)}, headers={"Cache-Control": "public, max-age=900"})


@router.get("/series/{series_id}")
def macro_series_one(series_id: str):
    item = get_macro_series(series_id)
    if item is None:
        raise HTTPException(404, f"Seri {series_id} tidak tersedia")
    return sanitize(item)


@router.get("/catalog")
def macro_catalog():
    """Daftar seri makro yang didukung."""
    return {"series": SERIES}
