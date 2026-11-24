"""Kripto spot — Binance public API (spot, gratis tanpa API key).

Semua harga/riwayat kripto di aplikasi kini memakai sumber ini, menggantikan
Yahoo Finance (BTC-USD, dll) supaya lebih lengkap & real-time.

Endpoint yang dipakai:
- /api/v3/ticker/24hr            snapshot harga + perubahan 24 jam
- /api/v3/klines                 OHLCV harian (riwayat chart)
- /fapi/v1/premiumIndex          funding rate & index price (futures) — opsional
"""

import logging
import threading
import time
from datetime import datetime, timezone

import requests

from app.data.tickers import CRYPTO_TICKERS, NEW_ASSETS
from app.services.cache import get as cache_get, set as cache_set

log = logging.getLogger(__name__)

SPOT_BASE = "https://api.binance.com"
FUT_BASE = "https://fapi.binance.com"
COINGECKO_BASE = "https://api.coingecko.com"
TIMEOUT = 10

_session = requests.Session()
# 24hr ticker dipakai untuk 60+ request/mnt di satu pool — batasi koneksi
_session.mount("https://", requests.adapters.HTTPAdapter(max_retries=2, pool_maxsize=24))
_lock = threading.Lock()

# Ticker internal → simbol Binance. 10 kripto di CRYPTO_TICKERS semua
# ber-quote USDT di Binance; kalau ada yang tidak, fallback USD, USDC.
_BINANCE_PAIRS = {}
for _t in CRYPTO_TICKERS:
    _meta = NEW_ASSETS.get(_t, {})
    _pair = _meta.get("binance") or "USDT"
    _BINANCE_PAIRS[_t] = f"{_t.upper()}{_pair}"

# Ticker → id CoinGecko (untuk market cap, gratis tanpa API key)
_COINGECKO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "XRP": "ripple",
    "ADA": "cardano",
    "DOGE": "dogecoin",
    "AVAX": "avalanche-2",
    "LINK": "chainlink",
    "DOT": "polkadot",
    "LTC": "litecoin",
}


def _pair(ticker):
    """Ticker internal → simbol trading Binance, mis. 'BTC' → 'BTCUSDT'."""
    return _BINANCE_PAIRS.get((ticker or "").upper(), f"{(ticker or '').upper()}USDT")


def _f(ticker):
    """Ticker internal → simbol Binance futures (funding rate), mis. 'BTC' → 'BTCUSDT'."""
    return _pair(ticker)


def binance_market_caps(ttl=3600):
    """Market cap + volume 24 jam dari CoinGecko (gratis, tanpa API key).

    Return: { 'BTC': {'market_cap': 1230000000000, 'vol_24h': 25000000000}, ... }
    """
    key = "coingecko:market_caps"
    cached = cache_get(key)
    if cached is not None:
        return cached
    try:
        ids = ",".join(_COINGECKO_IDS.values())
        r = _session.get(
            f"{COINGECKO_BASE}/api/v3/simple/price",
            params={"ids": ids, "vs_currencies": "usd", "include_market_cap": "true", "include_24hr_vol": "true"},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        data = r.json()
        out = {}
        for ticker, cg_id in _COINGECKO_IDS.items():
            d = data.get(cg_id, {})
            out[ticker] = {
                "market_cap": _fnum(d.get("usd_market_cap")),
                "vol_24h": _fnum(d.get("usd_24h_vol")),
            }
        if out:
            cache_set(key, out, ttl=ttl)
        return out
    except Exception as e:
        log.warning("coingecko market caps gagal: %s", e)
        return cached or {}


def _binance_limit(period, interval):
    """Peta period → jumlah candle Binance (kline max 1000)."""
    if interval == "1wk":
        weeks_map = {"1mo": 4, "3mo": 13, "6mo": 26, "1y": 52, "2y": 104, "3y": 156, "5y": 260, "max": 520}
        return weeks_map.get(period, 104)
    days_map = {"1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730, "3y": 1095, "5y": 1825, "max": 3650}
    return min(days_map.get(period, 180), 1000)


# ── helpers numerik ─────────────────────────────────────────────
def _fnum(value, default=None):
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _kline_rows(klines, interval):
    """Klines Binance → baris {date, open, high, low, close, volume}."""
    out = []
    for k in klines or []:
        try:
            open_t = int(k[0]) // 1000
            close = _fnum(k[4])
            if close is None:
                continue
            day = datetime.fromtimestamp(open_t, tz=timezone.utc)
            if interval == "1d":
                date_str = day.strftime("%Y-%m-%d")
            else:
                date_str = day.strftime("%Y-%m-%dT%H:%M:%S")
            out.append({
                "date": date_str,
                "open": _fnum(k[1]),
                "high": _fnum(k[2]),
                "low": _fnum(k[3]),
                "close": close,
                "volume": _fnum(k[5]),
            })
        except (IndexError, TypeError, ValueError):
            continue
    return out


# ── API utama ───────────────────────────────────────────────────

def binance_24h(ticker=None, ttl=30):
    """Snapshot 24 jam. Tanpa `ticker` → semua pasangan USDT sekaligus.

    Return: { 'BTC': {...}, ... } atau { 'BTC': {...} } untuk satu ticker.
    """
    with _lock:
        if ticker:
            try:
                r = _session.get(
                    f"{SPOT_BASE}/api/v3/ticker/24hr",
                    params={"symbol": _pair(ticker)},
                    timeout=TIMEOUT,
                )
                r.raise_for_status()
                d = r.json()
                return {ticker.upper(): _fmt_24h(d)}
            except Exception as e:
                log.warning("binance_24h(%s) gagal: %s", ticker, e)
                return {}
        else:
            r = _session.get(f"{SPOT_BASE}/api/v3/ticker/24hr", timeout=TIMEOUT)
            r.raise_for_status()
            rows = r.json()
            out = {}
            for d in rows:
                sym = (d.get("symbol") or "").upper()
                base = sym[: -len("USDT")] if sym.endswith("USDT") else None
                if not base or base not in CRYPTO_TICKERS:
                    continue
                out[base] = _fmt_24h(d)
            if out:
                cache_set("binance:24h", out, ttl=ttl)
            return out


def _fmt_24h(d):
    return {
        "symbol": d.get("symbol"),
        "price": _fnum(d.get("lastPrice")),
        "changePct": _fnum(d.get("priceChangePercent")),
        "high": _fnum(d.get("highPrice")),
        "low": _fnum(d.get("lowPrice")),
        "volume": _fnum(d.get("volume")),          # base quantity
        "quoteVolume": _fnum(d.get("quoteVolume")), # quote (USD) quantity
    }


def binance_history(ticker, interval="1d", limit=90):
    """Riwayat klines Binance. Return: daftar {date, open, high, low, close, volume}."""
    key = f"binance:hist:{ticker}:{interval}:{limit}"
    cached = cache_get(key)
    if cached is not None:
        return cached
    try:
        r = _session.get(
            f"{SPOT_BASE}/api/v3/klines",
            params={"symbol": _pair(ticker), "interval": interval, "limit": min(max(int(limit), 2), 1000)},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        rows = _kline_rows(r.json(), interval)
        if rows:
            cache_set(key, rows, ttl=300)
        return rows
    except Exception as e:
        log.warning("binance_history(%s) gagal: %s", ticker, e)
        return []


def binance_funding_rates(tickers=None, limit=30):
    """Funding rate futures 24 jam terakhir per ticker (opsional, untuk detail kripto)."""
    out = {}
    for t in (tickers or CRYPTO_TICKERS):
        try:
            r = _session.get(
                f"{FUT_BASE}/fapi/v1/fundingRate",
                params={"symbol": _f(t), "limit": limit},
                timeout=TIMEOUT,
            )
            r.raise_for_status()
            rows = r.json()
            rates = [_fnum(x.get("fundingRate")) for x in rows if _fnum(x.get("fundingRate")) is not None]
            out[t] = {
                "rates": rates,
                "latest": rates[-1] if rates else 0,
                "avg": sum(rates) / len(rates) if rates else 0,
            }
        except Exception as e:
            log.warning("binance_funding_rates(%s) gagal: %s", t, e)
            out[t] = {"rates": [], "latest": 0, "avg": 0}
    return out
