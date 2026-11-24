import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.services.market import (
    asset_kind,
    fetch_batch_histories,
    fetch_history,
    fetch_info,
    get_price_snapshot,
)
from app.services.analysis import (
    score_market_profile,
    score_fundamental,
    score_technical,
    combined_signal,
)
from app.services.seasonality import compute_seasonality
from app.services.cache import get, set as cache_set
from app.data.tickers import NEW_ASSET_TICKERS

WEEKLY_PERIOD = "3y"
WEEKLY_INTERVAL = "1wk"


def _fmt_cap(value):
    if value is None:
        return "—"
    try:
        v = float(value)
        if v >= 1e12:
            return f"{v / 1e12:.2f} T"
        if v >= 1e9:
            return f"{v / 1e9:.1f} B"
        if v >= 1e6:
            return f"{v / 1e6:.0f} M"
        return f"{v:,.0f}"
    except (TypeError, ValueError):
        return "—"


def _analyze(kind, info, history, weekly):
    """Hitung fundamental/market profile + teknikal + sinyal sesuai kelas aset."""
    tech = score_technical(history, weekly=weekly)
    fund = score_market_profile(info, history) if kind in ("crypto", "etf") else score_fundamental(info)
    combo = combined_signal(fund, tech, kind=kind)
    return fund, tech, combo


def _parse_fund_metric(info, key, default=None):
    """Fallback parser: coba langsung dari info, lalu dari audit_raw/metrics.
    
    Mengembalikan nilai untuk tampilan:
    - PER, PBV, DER, growth: nilai mentah (float)
    - ROE, ROA: nilai persen (float, mis. 14.2 untuk 14.2%)
    """
    val = info.get(key)
    if val is not None:
        try:
            v = float(val)
            # ROE/ROA umumnya dalam persen, kembalikan persen
            if key in ("return_on_equity", "return_on_assets") and v < 5:
                return v * 100
            return v
        except (TypeError, ValueError):
            pass
    # Fallback ke audit_raw
    raw = info.get("audit_raw") or {}
    val = raw.get(key)
    if val is not None:
        try:
            v = float(val)
            if key in ("return_on_equity", "return_on_assets") and v < 5:
                return v * 100
            return v
        except (TypeError, ValueError):
            pass
    # Fallback ke metrics (string format "38.1", "142.3%", dll)
    metrics = info.get("metrics") or {}
    val = metrics.get(key) if key in ("per", "roe", "pbv", "der", "growth") else None
    if val is not None:
        try:
            # Hapus % jika ada
            s = str(val).replace("%", "").replace(",", "")
            v = float(s)
            # Metrics ROE biasanya dalam persen (142.3% = 1.423 untuk scoring)
            # Jika value > 10 dan merupakan persen, ini kemungkinan data khusus
            # ROE/ROA sebenarnya biasanya < 100% untuk mayoritas saham
            if key in ("return_on_equity", "return_on_assets", "roe", "roa"):
                # Jika > 100, kemungkinan besar data lain, bukan ROE/ROA
                if v > 100:
                    return None
                return v
            return v
        except (TypeError, ValueError):
            pass
    return default


def _build_row(ticker, info, history, weekly):
    kind = asset_kind(ticker)
    snapshot = get_price_snapshot(history)
    fund, tech, combo = _analyze(kind, info, history, weekly)
    default_currency = "USD"
    has_financials = kind not in ("crypto", "etf")
    
    # Parse fundamental values with fallback
    per_val = _parse_fund_metric(info, "trailing_pe") if has_financials else None
    pbv_val = _parse_fund_metric(info, "price_to_book") if has_financials else None
    roe_val = _parse_fund_metric(info, "return_on_equity") if has_financials else None
    der_val = _parse_fund_metric(info, "debt_to_equity") if has_financials else None
    growth_val = _parse_fund_metric(info, "earnings_growth") if has_financials else None
    # Fallback growth ke metrics jika tidak ada
    if growth_val is None:
        growth_val = _parse_fund_metric(info, "growth")
    
    return {
        "ticker": ticker,
        "name": info.get("name") or ticker,
        "kind": kind,
        "sector": info.get("sector") or "Lainnya",
        "currency": info.get("currency") or default_currency,
        "website": info.get("website"),
        "logo_url": info.get("logo_url"),
        "logo_fallback": info.get("logo_fallback"),
        "price": snapshot["price"] if snapshot else None,
        "change": snapshot["change"] if snapshot else None,
        "volume": snapshot["volume"] if snapshot else None,
        "market_cap": _fmt_cap(info.get("market_cap")),
        "per": per_val,
        "pbv": pbv_val,
        "roe": roe_val,
        "der": der_val,
        "fundamental": fund,
        "technical": tech,
        "signal": combo["signal"],
        "composite": combo["composite"],
        "recommendation": info.get("recommendation"),
        "growth": growth_val,
    }


def analyze_stock(ticker, history=None, weekly=None, info=None, use_cache=True):
    cache_key = f"stock:{ticker}"
    if use_cache:
        cached = get(cache_key)
        if cached is not None:
            return cached

    if history is None:
        history = fetch_history(ticker, period="6mo")
    if weekly is None:
        weekly = fetch_history(ticker, period=WEEKLY_PERIOD, interval=WEEKLY_INTERVAL)
    if info is None:
        info = fetch_info(ticker)

    result = _build_row(ticker, info, history, weekly)

    if use_cache:
        cache_set(cache_key, result, ttl=900)
    return result


def get_stock_detail(ticker):
    code = ticker.upper()
    stock = {"ticker": code}

    def _fetch_history(period, interval):
        return fetch_history(code, period=period, interval=interval)

    with ThreadPoolExecutor(max_workers=4) as pool:
        # Fetch 5y buat semua period filter (1M/3M/6M/12M/5Y)
        f_hist = pool.submit(_fetch_history, "5y", "1d")
        f_week = pool.submit(_fetch_history, WEEKLY_PERIOD, WEEKLY_INTERVAL)
        f_info = pool.submit(fetch_info, code)
        history = f_hist.result()
        weekly = f_week.result()
        info = f_info.result()

    stock = analyze_stock(code, history=history, weekly=weekly, info=info, use_cache=False)
    stock["history"] = history
    stock["fundamental"]["metrics"]["market_cap"] = stock["market_cap"]
    return stock


def build_all():
    """Fetch all prices in one batch, enrich with info (parallel), return full analysis."""
    histories = fetch_batch_histories(NEW_ASSET_TICKERS, period="6mo")
    weeklies = fetch_batch_histories(NEW_ASSET_TICKERS, period=WEEKLY_PERIOD, interval=WEEKLY_INTERVAL)

    def build(ticker):
        history = histories.get(ticker)
        if not history:
            return None
        try:
            info = fetch_info(ticker)
        except Exception:
            info = {"name": ticker}
        return _build_row(ticker, info, history, weeklies.get(ticker))

    results = []
    with ThreadPoolExecutor(max_workers=16) as pool:
        futs = {pool.submit(build, t): t for t in NEW_ASSET_TICKERS}
        for fut in as_completed(futs):
            item = fut.result()
            if item:
                results.append(item)
    results.sort(key=lambda s: (s["composite"] if s["composite"] is not None else -1), reverse=True)
    return results