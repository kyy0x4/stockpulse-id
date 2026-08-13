import time
import warnings
from urllib.parse import urlparse

import numpy as np
import pandas as pd
import yfinance as yf

from app.data.tickers import SECTOR_GROUP, ALL_TICKERS, LOGO_OVERRIDES
from app.services.cache import get as cache_get, set as cache_set

warnings.filterwarnings("ignore")


def domain_from_website(url):
    """Ekstrak domain (tanpa www) dari URL website emiten."""
    try:
        host = (urlparse(url).netloc or urlparse("//" + url).netloc).lower()
        if host.startswith("www."):
            host = host[4:]
        return host or None
    except Exception:
        return None


def fetch_batch_histories(tickers=None, period="6mo", interval="1d", ttl=600):
    """Download price history for many tickers in a single request.

    Hasil di-cache selama `ttl` (default 10 mnt) — harga pasar cepat berubah,
    tapi untuk screener snapshot 10 menit sudah cukup dan mencegah re-download
    240 ticker saat /warm & /stocks dipanggil beruntun.
    """
    codes = list(tickers or ALL_TICKERS)
    key = f"bh:{period}:{interval}"
    cached = cache_get(key)
    if cached is not None:
        # kembalikan subset; semua kode dimuat sekali, kode baru = cache miss
        return {c: cached[c] for c in codes if c in cached}

    t0 = time.time()
    yahoo = [f"{t}.JK" for t in codes]
    frames = yf.download(tickers=yahoo, period=period, interval=interval, auto_adjust=True, actions=False, group_by="ticker", threads=True)
    out = {}
    for code in codes:
        key_t = f"{code}.JK"
        try:
            df = frames[key_t].dropna(how="all")
            if df.empty:
                continue
            df = df.reset_index()
            rows = [
                {
                    "date": row["Date"].strftime("%Y-%m-%d") if isinstance(row["Date"], pd.Timestamp) else str(row["Date"]),
                    "open": _clean(row.get("Open")),
                    "high": _clean(row.get("High")),
                    "low": _clean(row.get("Low")),
                    "close": _clean(row.get("Close")),
                    "volume": _clean(row.get("Volume")),
                }
                for _, row in df.iterrows()
            ]
            out[code] = rows
        except Exception:
            continue
    if out:
        cache_set(key, out, ttl=ttl)
    return out


def _clean(value):
    if value is None:
        return None
    if isinstance(value, (np.floating, np.integer)):
        return float(value)
    if pd.isna(value):
        return None
    return value


def fetch_history(ticker, period="6mo", interval="1d"):
    t = yf.Ticker(f"{ticker}.JK")
    hist = t.history(period=period, interval=interval, auto_adjust=True, actions=False)
    hist = hist.reset_index()
    data = [
        {
            "date": row.Date.strftime("%Y-%m-%d") if hasattr(row.Date, "strftime") else str(row.Date),
            "open": _clean(row.Open),
            "high": _clean(row.High),
            "low": _clean(row.Low),
            "close": _clean(row.Close),
            "volume": _clean(row.Volume),
        }
        for _, row in hist.iterrows()
    ]
    return data


def fetch_ihsg(period="1y", interval="1d"):
    """Fetch real IHSG (^JKSE) index history + current snapshot."""
    try:
        hist = yf.download(
            tickers="^JKSE", period=period, interval=interval,
            auto_adjust=True, actions=False, progress=False,
        )
    except Exception:
        return None
    if hist is None or hist.empty:
        return None
    if isinstance(hist.columns, pd.MultiIndex):
        hist.columns = hist.columns.get_level_values(0)
    hist = hist.reset_index()
    rows = [
        {
            "date": row.Date.strftime("%Y-%m-%d") if hasattr(row.Date, "strftime") else str(row.Date),
            "open": _clean(row.get("Open")),
            "high": _clean(row.get("High")),
            "low": _clean(row.get("Low")),
            "close": _clean(row.get("Close")),
            "volume": _clean(row.get("Volume")),
        }
        for _, row in hist.iterrows()
    ]
    if not rows:
        return None
    last = rows[-1]
    first = rows[0]
    prev = rows[-2] if len(rows) > 1 else first
    change = ((last["close"] - prev["close"]) / prev["close"] * 100) if prev["close"] else 0
    ytd = ((last["close"] - first["close"]) / first["close"] * 100) if first["close"] else 0
    return {
        "name": "IHSG",
        "code": "^JKSE",
        "price": last["close"],
        "change": round(change, 2),
        "ytd": round(ytd, 2),
        "last_updated": last["date"],
        "history": rows,
    }


def fetch_info(ticker, ttl=6 * 3600):
    """Fundamental info per ticker, dicache 6 jam (tidak berubah intraday).

    Harga/change/volume tetap fresh dari history batch; hanya data fundamental
    (PER, PBV, ROE, market cap, ...) yang di-cache supaya build_all cepat.
    """
    key = f"info:{ticker}"
    cached = cache_get(key)
    if cached is not None:
        return cached

    t = yf.Ticker(f"{ticker}.JK")
    info = t.info
    sector = _clean(info.get("sector"))
    website = _clean(info.get("website"))
    domain = domain_from_website(website)
    override = LOGO_OVERRIDES.get(ticker)
    icon_horse = f"https://icon.horse/icon/{domain}" if domain else None
    google_fav = f"https://www.google.com/s2/favicons?domain={domain}&sz=128" if domain else None
    result = {
        "name": info.get("longName") or info.get("shortName") or ticker,
        "domain": domain,
        "website": website,
        "logo_url": override or icon_horse,
        "logo_fallback": google_fav,
        "sector_raw": sector,
        "sector": SECTOR_GROUP.get(sector, sector or "Lainnya"),
        "currency": info.get("currency") or "IDR",
        "market_cap": _clean(info.get("marketCap")),
        "trailing_pe": _clean(info.get("trailingPE")),
        "forward_pe": _clean(info.get("forwardPE")),
        "price_to_book": _clean(info.get("priceToBook")),
        "return_on_equity": _clean(info.get("returnOnEquity")),
        "return_on_assets": _clean(info.get("returnOnAssets")),
        "debt_to_equity": _clean(info.get("debtToEquity")),
        "current_ratio": _clean(info.get("currentRatio")),
        "revenue_growth": _clean(info.get("revenueGrowth")),
        "earnings_growth": _clean(info.get("earningsGrowth")),
        "dividend_yield": _clean(info.get("dividendYield")),
        "profit_margins": _clean(info.get("profitMargins")),
        "operating_margins": _clean(info.get("operatingMargins")),
        "revenue": _clean(info.get("totalRevenue")),
        "net_income": _clean(info.get("netIncomeToCommon")),
        "free_cashflow": _clean(info.get("freeCashflow")),
        "target_mean_price": _clean(info.get("targetMeanPrice")),
        "recommendation": info.get("recommendationKey"),
        "number_of_analysts": _clean(info.get("numberOfAnalystOpinions")),
        "audit_raw": info,
    }
    cache_set(key, result, ttl=ttl)
    return result


def get_price_snapshot(history):
    if not history:
        return None
    last = history[-1]
    prev = history[-2] if len(history) > 1 else last
    price = last["close"]
    prev_close = prev["close"]
    change = ((price - prev_close) / prev_close * 100) if prev_close else 0
    volume = last.get("volume")
    return {"price": price, "change": round(change, 2), "volume": volume}