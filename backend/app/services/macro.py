"""Data ekonomi AS & indikator makro global dari FRED (gratis, tanpa API key).

FRED menyediakan endpoint CSV publik:
    https://fred.stlouisfed.org/graph/fredgraph.csv?id=SERIES_ID

Semua seri di-cache 1 jam karena data makro hanya berubah harian/bulanan.
"""

import concurrent.futures as cf
import csv
import io
import urllib.request
from datetime import datetime, timezone

from app.services.cache import get as cache_get, set as cache_set

# FRED (Akamai) menahan request browser-UA dari klien non-browser hingga timeout;
# UA curl dilayani normal, jadi pakai itu untuk unduhan CSV publik.
UA = {"User-Agent": "curl/8.7.1"}

FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}"

# `transform`:
#   level → nilai terakhir
#   yoy   → % perubahan vs periode yang sama tahun lalu (periods_back = 12 bulan / 4 kuartal)
#   chg   → selisih absolut vs periode sebelumnya
SERIES = [
    {"id": "CPIAUCSL", "label": "Inflasi CPI (YoY)", "unit": "%", "transform": "yoy", "periods_back": 12, "kind": "inflation"},
    {"id": "CPILFESL", "label": "Inflasi Core CPI (YoY)", "unit": "%", "transform": "yoy", "periods_back": 12, "kind": "inflation"},
    {"id": "PCEPI", "label": "Inflasi PCE (YoY)", "unit": "%", "transform": "yoy", "periods_back": 12, "kind": "inflation"},
    {"id": "UNRATE", "label": "Tingkat Pengangguran", "unit": "%", "transform": "level", "periods_back": 1, "kind": "labor"},
    {"id": "PAYEMS", "label": "Nonfarm Payrolls (MoM)", "unit": "ribu", "transform": "chg", "periods_back": 1, "kind": "labor"},
    {"id": "GDPC1", "label": "GDP Riil (YoY)", "unit": "%", "transform": "yoy", "periods_back": 4, "kind": "growth"},
    {"id": "FEDFUNDS", "label": "Fed Funds Rate", "unit": "%", "transform": "level", "periods_back": 1, "kind": "rate"},
    {"id": "DGS10", "label": "US Treasury 10Y", "unit": "%", "transform": "level", "periods_back": 1, "kind": "rate"},
    {"id": "DGS2", "label": "US Treasury 2Y", "unit": "%", "transform": "level", "periods_back": 1, "kind": "rate"},
    {"id": "UMCSENT", "label": "Consumer Sentiment", "unit": "indeks", "transform": "level", "periods_back": 1, "kind": "sentiment"},
    {"id": "MORTGAGE30US", "label": "Mortgage 30Y", "unit": "%", "transform": "level", "periods_back": 1, "kind": "rate"},
    {"id": "DCOILWTICO", "label": "Harga Minyak WTI", "unit": "USD", "transform": "level", "periods_back": 1, "kind": "commodity"},
]


def _fetch_series(series_id, timeout=12):
    url = FRED_CSV.format(series=series_id)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        text = res.read().decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for row in reader:
        raw = (row.get(series_id) or "").strip()
        if not raw or raw == ".":
            continue
        try:
            rows.append((row.get("DATE") or row.get("observation_date") or "", float(raw)))
        except ValueError:
            continue
    return rows


def _chart_series(rows, transform, back):
    """Seri untuk chart, memakai transform yang sama dengan nilai headline."""
    out = []
    for i, (date, value) in enumerate(rows):
        if transform == "yoy":
            if i < back or not rows[i - back][1]:
                continue
            out.append((date, round((value / rows[i - back][1] - 1) * 100, 2)))
        elif transform == "chg":
            if i < back:
                continue
            out.append((date, round(value - rows[i - back][1], 2)))
        else:
            out.append((date, value))
    return out[-24:]


def _transform(rows, spec):
    if not rows:
        return None
    transform = spec.get("transform", "level")
    back = max(1, int(spec.get("periods_back", 1)))
    date, value = rows[-1]

    prev = rows[-2][1] if len(rows) >= 2 else None
    base = rows[-1 - back][1] if len(rows) > back else None

    if transform == "yoy":
        result = ((value / base) - 1) * 100 if base else None
    elif transform == "chg":
        result = (value - base) if base is not None else None
    else:
        result = value

    change = None
    if prev is not None and result is not None:
        if transform == "yoy":
            prev_yoy = ((prev / rows[-2 - back][1]) - 1) * 100 if len(rows) > back + 1 and rows[-2 - back][1] else None
            change = (result - prev_yoy) if prev_yoy is not None else None
        elif transform == "chg":
            prev_chg = (prev - rows[-2 - back][1]) if len(rows) > back + 1 else None
            change = (result - prev_chg) if prev_chg is not None else None
        else:
            change = result - prev

    return {
        "id": spec["id"],
        "label": spec["label"],
        "unit": spec["unit"],
        "kind": spec["kind"],
        "value": round(result, 2) if result is not None else None,
        "change": round(change, 2) if change is not None else None,
        "previous": round(prev, 2) if prev is not None else None,
        "date": date,
        "series": _chart_series(rows, transform, back),
    }


def get_macro_snapshot(ttl=3600):
    """Snapshot indikator makro AS utama (FRED, gratis tanpa API key)."""
    key = "macro:snapshot"
    cached = cache_get(key)
    if cached is not None:
        return cached

    def _one(spec):
        try:
            return _transform(_fetch_series(spec["id"]), spec)
        except Exception:
            return None

    with cf.ThreadPoolExecutor(max_workers=8) as pool:
        indicators = [item for item in pool.map(_one, SERIES) if item is not None]

    result = {
        "updated": datetime.now(timezone.utc).isoformat(),
        "source": "FRED (Federal Reserve Bank of St. Louis)",
        "indicators": indicators,
    }
    if indicators:
        cache_set(key, result, ttl=ttl)
    return result


def get_macro_series(series_id, ttl=3600):
    """Ambil satu seri FRED mentah (untuk chart)."""
    spec = next((s for s in SERIES if s["id"] == series_id.upper()), None)
    if spec is None:
        return None
    key = f"macro:series:{spec['id']}"
    cached = cache_get(key)
    if cached is not None:
        return cached
    try:
        rows = _fetch_series(spec["id"])
    except Exception:
        return None
    item = _transform(rows, spec)
    if item is not None:
        cache_set(key, item, ttl=ttl)
    return item
