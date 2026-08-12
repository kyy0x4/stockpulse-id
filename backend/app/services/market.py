import time
import warnings

import numpy as np
import pandas as pd
import yfinance as yf

from app.data.tickers import SECTOR_GROUP, ALL_TICKERS

warnings.filterwarnings("ignore")


def fetch_batch_histories(tickers=None, period="6mo", interval="1d"):
    """Download price history for many tickers in a single request."""
    codes = tickers or ALL_TICKERS
    yahoo = [f"{t}.JK" for t in codes]
    frames = yf.download(tickers=yahoo, period=period, interval=interval, auto_adjust=True, actions=False, group_by="ticker", threads=True)
    out = {}
    for code in codes:
        key = f"{code}.JK"
        try:
            df = frames[key].dropna(how="all")
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


def fetch_info(ticker):
    t = yf.Ticker(f"{ticker}.JK")
    info = t.info
    sector = _clean(info.get("sector"))
    return {
        "name": info.get("longName") or info.get("shortName") or ticker,
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