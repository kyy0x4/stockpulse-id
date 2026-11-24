import hashlib
import threading
import time
import warnings
from urllib.parse import urlparse

import numpy as np
import pandas as pd
import yfinance as yf

from app.data.tickers import (
    ALL_TICKERS,
    CRYPTO_TICKERS,
    US_STOCKS,
    MARKET_ASSETS,
    NEW_ASSETS,
    LOGO_OVERRIDES,
)
from app.services.cache import get as cache_get, set as cache_set
from app.services.binance import binance_24h, binance_history, binance_market_caps, _binance_limit

warnings.filterwarnings("ignore")

# yfinance memakai state global yang tidak aman dipakai paralel untuk simbol
# berbeda. Serialisasi download indeks supaya request SPX/BTC/ETH yang datang
# bersamaan tidak saling menimpa (pernah bikin BTC/ETH berisi data S&P 500).
_index_lock = threading.Lock()

def yf_symbol(ticker):
    """Ticker internal → simbol Yahoo Finance.

    - Kripto spot : BTC   → BTC-USD
    - ETF         : SPY   → SPY
    - Indeks      : SPX   → ^GSPC (via MARKET_ASSETS)
    - Saham AS    : AAPL  → AAPL
    """
    t = (ticker or "").upper()
    for asset in MARKET_ASSETS:
        if asset["ticker"] == t:
            return asset["yf"]
    if t in NEW_ASSETS and NEW_ASSETS[t].get("kind") == "crypto":
        return NEW_ASSETS[t].get("yf") or f"{t}-USD"
    return t


def asset_kind(ticker):
    """Klasifikasi aset: 'crypto', 'us_stock', 'etf', atau 'index'."""
    t = (ticker or "").upper()
    for asset in MARKET_ASSETS:
        if asset["ticker"] == t:
            return asset["kind"]
    if t in NEW_ASSETS:
        return NEW_ASSETS[t].get("kind", "us_stock")
    if t in CRYPTO_TICKERS:
        return "crypto"
    return "us_stock"


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
    """Batch history: Kripto via Binance, lainnya via Yahoo Finance."""
    codes = list(tickers or ALL_TICKERS)
    
    # 1. Split tickers
    crypto_tickers = [c for c in codes if asset_kind(c) == "crypto"]
    stock_tickers = [c for c in codes if asset_kind(c) != "crypto"]
    
    out = {}
    
    # 2. Fetch Kripto (Binance)
    for c in crypto_tickers:
        limit = _binance_limit(period, interval)
        hist = binance_history(c, interval=interval, limit=limit)
        if hist:
            out[c] = hist
            
    # 3. Fetch Saham/ETF (Yahoo Finance)
    if stock_tickers:
        sig = hashlib.md5(",".join(sorted(stock_tickers)).encode()).hexdigest()[:10]
        key = f"bh:{period}:{interval}:{sig}"
        cached = cache_get(key)
        if cached is not None:
            for c in stock_tickers:
                if c in cached: out[c] = cached[c]
        else:
            t0 = time.time()
            yahoo = [yf_symbol(t) for t in stock_tickers]
            frames = yf.download(tickers=yahoo, period=period, interval=interval, auto_adjust=True, actions=False, group_by="ticker", threads=True, progress=False)
            multi = isinstance(frames.columns, pd.MultiIndex)
            
            stock_results = {}
            for code in stock_tickers:
                key_t = yf_symbol(code)
                try:
                    df = frames[key_t] if multi else frames
                    df = df.dropna(how="all")
                    if df.empty: continue
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
                        if _clean(row.get("Close")) is not None
                    ]
                    stock_results[code] = rows
                    out[code] = rows
                except Exception:
                    continue
            if stock_results:
                cache_set(key, stock_results, ttl=ttl)
                
    return out


def _clean(value):
    if value is None:
        return None
    if isinstance(value, (np.floating, np.integer)):
        value = float(value)
    if pd.isna(value):
        return None
    return value


def fetch_history(ticker, period="6mo", interval="1d"):
    # Kripto → Binance (lebih lengkap & real-time)
    if asset_kind(ticker) == "crypto":
        limit = _binance_limit(period, interval)
        return binance_history(ticker, interval=interval, limit=limit)

    t = yf.Ticker(yf_symbol(ticker))
    hist = t.history(period=period, interval=interval, auto_adjust=True, actions=False)
    hist = hist.reset_index()
    data = []
    for _, row in hist.iterrows():
        close = _clean(row.Close)
        if close is None:
            continue
        data.append({
            "date": row.Date.strftime("%Y-%m-%d") if hasattr(row.Date, "strftime") else str(row.Date),
            "open": _clean(row.Open),
            "high": _clean(row.High),
            "low": _clean(row.Low),
            "close": close,
            "volume": _clean(row.Volume),
        })
    return data


def fetch_market_index(code="SPX", period="1y", interval="1d"):
    """Fetch indeks / aset pasar (S&P 500, Nasdaq, Dow, BTC, ETH)."""
    t_upper = (code or "").upper()
    asset = next((a for a in MARKET_ASSETS if a["ticker"] == t_upper), None)
    
    # Kripto → Binance
    if asset and asset.get("kind") == "crypto":
        limit = _binance_limit(period, interval)
        rows = binance_history(t_upper, interval=interval, limit=limit)
        if not rows:
            return None
        last = rows[-1]
        first = rows[0]
        prev = rows[-2] if len(rows) > 1 else first
        change = ((last["close"] - prev["close"]) / prev["close"] * 100) if prev["close"] else 0
        ytd = ((last["close"] - first["close"]) / first["close"] * 100) if first["close"] else 0
        return {
            "name": asset["name"],
            "code": t_upper,
            "yf": asset["yf"], # Simpan yf alias untuk kompatibilitas UI jika perlu
            "kind": "crypto",
            "price": last["close"],
            "change": round(change, 2),
            "ytd": round(ytd, 2),
            "last_updated": last["date"],
            "history": rows,
        }

    # Indeks → Yahoo Finance (GSPC, IXIC, DJI)
    if asset is None:
        asset = {"ticker": t_upper, "yf": yf_symbol(code), "name": t_upper}
    try:
        with _index_lock:
            hist = yf.download(
                tickers=asset["yf"], period=period, interval=interval,
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
        "name": asset["name"],
        "code": asset["ticker"],
        "yf": asset["yf"],
        "kind": asset.get("kind", "index"),
        "price": last["close"],
        "change": round(change, 2),
        "ytd": round(ytd, 2),
        "last_updated": last["date"],
        "history": rows,
    }


def fetch_ihsg(period="1y", interval="1d"):
    """Kompatibilitas: IHSG kini diperlakukan sebagai aset pasar biasa."""
    return fetch_market_index("SPX", period=period, interval=interval)


def fetch_info(ticker, ttl=6 * 3600):
    """Fundamental info per ticker, dicache 6 jam (tidak berubah intraday).

    Harga/change/volume tetap fresh dari history batch; hanya data fundamental
    (PER, PBV, ROE, market cap, ...) yang di-cache supaya build_all cepat.
    """
    key = f"info:{ticker}"
    cached = cache_get(key)
    if cached is not None:
        return cached

    t = yf.Ticker(yf_symbol(ticker))
    info = t.info
    kind = asset_kind(ticker)
    meta = NEW_ASSETS.get((ticker or "").upper(), {})

    # Kripto → pakai snapshot Binance (fundamental saham tidak berlaku utk kripto)
    if kind == "crypto":
        snap = binance_24h(ticker).get((ticker or "").upper(), {})
        caps = binance_market_caps().get((ticker or "").upper(), {})
        result = {
            "name": meta.get("name") or ticker,
            "kind": kind,
            "sector": meta.get("sector") or "Kripto",
            "currency": "USD",
            "market_cap": caps.get("market_cap"),
            "trailing_pe": None,
            "forward_pe": None,
            "price_to_book": None,
            "return_on_equity": None,
            "return_on_assets": None,
            "debt_to_equity": None,
            "current_ratio": None,
            "revenue_growth": None,
            "earnings_growth": None,
            "dividend_yield": None,
            "profit_margins": None,
            "operating_margins": None,
            "revenue": None,
            "net_income": None,
            "free_cashflow": None,
            "target_mean_price": None,
            "recommendation": None,
            "number_of_analysts": None,
            "last_price": snap.get("price"),
            "change_24h": snap.get("changePct"),
            "binance_symbol": snap.get("symbol"),
            "audit_raw": {},
        }
        cache_set(key, result, ttl=ttl)
        return result

    sector_raw = _clean(info.get("sector"))
    website = _clean(info.get("website"))
    domain = domain_from_website(website)
    override = LOGO_OVERRIDES.get(ticker)
    icon_horse = f"https://icon.horse/icon/{domain}" if domain else None
    google_fav = f"https://www.google.com/s2/favicons?domain={domain}&sz=128" if domain else None
    sector = sector_raw or meta.get("sector") or "Lainnya"
    default_currency = "USD"
    market_cap = _clean(info.get("marketCap"))
    if market_cap is None:
        # ETF tidak punya marketCap; pakai total aset bersih sebagai ukuran.
        market_cap = _clean(info.get("totalAssets"))
    # Yahoo melaporkan debtToEquity dalam persen (mis. 145 = 1,45x), bukan rasio.
    der = _clean(info.get("debtToEquity"))
    if der is not None and der > 10:
        der = round(der / 100, 2)
    result = {
        "name": info.get("longName") or info.get("shortName") or meta.get("name") or ticker,
        "kind": kind,
        "domain": domain,
        "website": website,
        "logo_url": override or icon_horse,
        "logo_fallback": google_fav,
        "sector_raw": sector_raw,
        "sector": sector,
        "currency": info.get("currency") or default_currency,
        "market_cap": market_cap,
        "trailing_pe": _clean(info.get("trailingPE")),
        "forward_pe": _clean(info.get("forwardPE")),
        "price_to_book": _clean(info.get("priceToBook")),
        "return_on_equity": _clean(info.get("returnOnEquity")),
        "return_on_assets": _clean(info.get("returnOnAssets")),
        "debt_to_equity": der,
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
    if price is None:
        return None
    prev_close = prev["close"]
    change = ((price - prev_close) / prev_close * 100) if prev_close else 0
    volume = last.get("volume")
    return {"price": price, "change": round(change, 2), "volume": volume}