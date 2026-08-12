import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.services.market import fetch_batch_histories, fetch_history, fetch_info, get_price_snapshot
from app.services.analysis import score_fundamental, score_technical, combined_signal
from app.services.cache import get, set as cache_set
from app.data.tickers import ALL_TICKERS

WEEKLY_PERIOD = "3y"
WEEKLY_INTERVAL = "1wk"


def _fmt_idr(value):
    if value is None:
        return "—"
    try:
        v = float(value)
        if v >= 1e12:
            return f"{v / 1e12:.2f} T"
        if v >= 1e9:
            return f"{v / 1e9:.1f} M"
        if v >= 1e6:
            return f"{v / 1e6:.0f} M"
        return f"{v:,.0f}"
    except (TypeError, ValueError):
        return "—"


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

    snapshot = get_price_snapshot(history)
    fund = score_fundamental(info)
    tech = score_technical(history, weekly=weekly)
    combo = combined_signal(fund, tech)

    result = {
        "ticker": ticker,
        "name": info.get("name") or ticker,
        "sector": info.get("sector") or "Lainnya",
        "currency": info.get("currency") or "IDR",
        "website": info.get("website"),
        "logo_url": info.get("logo_url"),
        "price": snapshot["price"] if snapshot else None,
        "change": snapshot["change"] if snapshot else None,
        "volume": snapshot["volume"] if snapshot else None,
        "market_cap": _fmt_idr(info.get("market_cap")),
        "per": info.get("trailing_pe"),
        "pbv": info.get("price_to_book"),
        "roe": info.get("return_on_equity"),
        "der": info.get("debt_to_equity"),
        "fundamental": fund,
        "technical": tech,
        "signal": combo["signal"],
        "composite": combo["composite"],
        "recommendation": info.get("recommendation"),
    }

    if use_cache:
        cache_set(cache_key, result, ttl=900)
    return result


def get_stock_detail(ticker):
    code = ticker.upper()
    history = fetch_history(code, period="6mo")
    weekly = fetch_history(code, period=WEEKLY_PERIOD, interval=WEEKLY_INTERVAL)
    info = fetch_info(code)
    stock = analyze_stock(code, history=history, weekly=weekly, info=info, use_cache=False)
    stock["history"] = history[-90:]
    stock["fundamental"]["metrics"]["market_cap"] = stock["market_cap"]
    return stock


def build_all():
    """Fetch all prices in one batch, enrich with info (parallel), return full analysis."""
    histories = fetch_batch_histories(ALL_TICKERS, period="6mo")
    weeklies = fetch_batch_histories(ALL_TICKERS, period=WEEKLY_PERIOD, interval=WEEKLY_INTERVAL)

    def build(ticker):
        history = histories.get(ticker)
        if not history:
            return None
        try:
            info = fetch_info(ticker)
        except Exception:
            info = {"name": ticker}
        snapshot = get_price_snapshot(history)
        fund = score_fundamental(info)
        tech = score_technical(history, weekly=weeklies.get(ticker))
        combo = combined_signal(fund, tech)
        return {
            "ticker": ticker,
            "name": info.get("name") or ticker,
            "sector": info.get("sector") or "Lainnya",
            "currency": info.get("currency") or "IDR",
            "website": info.get("website"),
            "logo_url": info.get("logo_url"),
            "price": snapshot["price"] if snapshot else None,
            "change": snapshot["change"] if snapshot else None,
            "volume": snapshot["volume"] if snapshot else None,
            "market_cap": _fmt_idr(info.get("market_cap")),
            "per": info.get("trailing_pe"),
            "pbv": info.get("price_to_book"),
            "roe": info.get("return_on_equity"),
            "der": info.get("debt_to_equity"),
            "fundamental": fund,
            "technical": tech,
            "signal": combo["signal"],
            "composite": combo["composite"],
            "recommendation": info.get("recommendation"),
        }

    results = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futs = {pool.submit(build, t): t for t in ALL_TICKERS}
        for fut in as_completed(futs):
            item = fut.result()
            if item:
                results.append(item)
    results.sort(key=lambda s: (s["composite"] if s["composite"] is not None else -1), reverse=True)
    return results