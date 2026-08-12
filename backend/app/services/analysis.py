import numpy as np
import pandas as pd


def _score(value, thresholds):
    if value is None:
        return 50
    cfg = thresholds[0]
    op = cfg["op"]
    if op == "<":
        if value < cfg["good"]:
            return cfg["score"]
        if value < cfg["mid"]:
            return 65
        if value < cfg["bad"]:
            return 40
        return 20
    # op == ">"
    if value > cfg["good"]:
        return cfg["score"]
    if value > cfg["mid"]:
        return 65
    if value > cfg["bad"]:
        return 40
    return 20


def score_fundamental(info):
    pe = info.get("trailing_pe")
    pbv = info.get("price_to_book")
    roe = info.get("return_on_equity")
    roa = info.get("return_on_assets")
    der = info.get("debt_to_equity")
    growth = info.get("earnings_growth")
    rev_growth = info.get("revenue_growth")
    marg = info.get("profit_margins")

    components = {
        "PER": _score(pe, [{"op": "<", "bad": 30, "mid": 18, "good": 12, "score": 95, "default": 30}]),
        "PBV": _score(pbv, [{"op": "<", "bad": 4, "mid": 2.5, "good": 1.5, "score": 90, "default": 40}]),
        "ROE": _score(roe, [{"op": ">", "bad": 0.05, "mid": 0.12, "good": 0.18, "score": 95, "default": 30}]),
        "ROA": _score(roa, [{"op": ">", "bad": 0.02, "mid": 0.06, "good": 0.10, "score": 90, "default": 30}]),
        "DER": _score(der, [{"op": "<", "bad": 2.0, "mid": 1.0, "good": 0.6, "score": 90, "default": 50}]),
        "Growth laba": _score(growth, [{"op": ">", "bad": 0.0, "mid": 0.08, "good": 0.15, "score": 95, "default": 30}]),
        "Pertumbuhan revenue": _score(rev_growth, [{"op": ">", "bad": 0.0, "mid": 0.08, "good": 0.15, "score": 90, "default": 40}]),
        "Margin laba": _score(marg, [{"op": ">", "bad": 0.03, "mid": 0.12, "good": 0.20, "score": 90, "default": 40}]),
    }

    weights = {
        "PER": 0.15, "PBV": 0.12, "ROE": 0.18, "ROA": 0.08,
        "DER": 0.12, "Growth laba": 0.15, "Pertumbuhan revenue": 0.10, "Margin laba": 0.10,
    }

    total = sum(components[k] * weights[k] for k in weights)
    total = max(0, min(100, round(total)))

    best = "sangat menarik" if total >= 80 else "menarik" if total >= 70 else "cukup" if total >= 60 else "lemah"

    return {
        "score": total,
        "rating": best,
        "components": {k: v for k, v in sorted(components.items(), key=lambda x: -x[1])},
        "metrics": {
            "per": _fmt(pe, 1),
            "pbv": _fmt(pbv, 2),
            "roe": _pct(roe, 1),
            "roa": _pct(roa, 1),
            "der": _fmt(der, 2),
            "net_margin": _pct(marg, 1),
            "growth": _pct(growth, 1),
            "revenue_growth": _pct(rev_growth, 1),
        },
    }


def score_technical(history):
    if not history or len(history) < 30:
        return {
            "score": None,
            "trend": "Data tidak cukup",
            "rsi": None,
            "macd": "N/A",
            "vol_ratio": None,
            "sma50": None,
            "sma200": None,
            "close": None,
            "note": "Perlu minimal 30 hari data",
        }

    df = pd.DataFrame(history)
    close = df["close"].astype(float)

    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = float((100 - (100 / (1 + rs))).iloc[-1]) if (100 / (1 + rs)).iloc[-1] is not None else 50

    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    macd_cross = "Bullish" if macd_line.iloc[-1] > signal_line.iloc[-1] else "Bearish"
    macd_positive = macd_line.iloc[-1] > 0

    sma50 = float(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else None
    sma200 = float(close.rolling(200).mean().iloc[-1]) if len(close) >= 200 else None

    vol_avg = float(df["volume"].astype(float).rolling(20).mean().iloc[-1]) if "volume" in df else None
    vol_last = float(df["volume"].astype(float).iloc[-1]) if "volume" in df else None
    vol_ratio = round(vol_last / vol_avg, 2) if vol_avg and vol_last else None

    close = float(close.iloc[-1])
    trend, trend_score = _detect_trend(close, sma50, sma200, ema12.iloc[-1], ema26.iloc[-1])

    components = {
        "RSI": _rsi_score(rsi),
        "MACD": 90 if macd_cross == "Bullish" and macd_positive else 70 if macd_cross == "Bullish" else 35,
        "Trend (SMA)": trend_score,
        "Volume": _vol_score(vol_ratio),
    }

    weights = {"RSI": 0.25, "MACD": 0.25, "Trend (SMA)": 0.30, "Volume": 0.20}
    total = round(sum(components[k] * weights[k] for k in weights))
    total = max(0, min(100, total))

    return {
        "score": total,
        "trend": trend,
        "rsi": round(rsi, 1),
        "macd": macd_cross,
        "vol_ratio": vol_ratio,
        "sma50": _fmt(sma50, 0),
        "sma200": _fmt(sma200, 0),
        "close": _fmt(close, 0),
        "components": components,
    }


def _detect_trend(close, sma50, sma200, ema12, ema26):
    uptrend_strength = 0
    if ema12 > ema26:
        uptrend_strength += 1
    if sma50 and close > sma50:
        uptrend_strength += 1
    if sma200 and close > sma200:
        uptrend_strength += 2

    if uptrend_strength >= 3:
        return "Uptrend", 90
    if uptrend_strength == 2:
        return "Sideways", 60
    if uptrend_strength == 1:
        return "Sideways lemah", 45
    return "Downtrend", 20


def _rsi_score(rsi):
    if rsi > 70:
        return 30
    if rsi >= 55:
        return 80
    if rsi >= 40:
        return 70
    if rsi >= 30:
        return 45
    return 70


def _vol_score(ratio):
    if ratio is None:
        return 50
    if ratio >= 2.5:
        return 75
    if ratio >= 1.3:
        return 90
    if ratio >= 0.9:
        return 70
    if ratio >= 0.6:
        return 50
    return 30


def combined_signal(fund, tech):
    f = fund.get("score")
    t = tech.get("score")
    if f is None or t is None:
        return {"signal": "HOLD", "composite": None}

    composite = round(f * 0.6 + t * 0.4)
    if f >= 70 and t >= 60:
        signal = "BUY"
    elif f >= 55 and t >= 45:
        signal = "HOLD"
    else:
        signal = "SELL"

    if f >= 80 and t >= 70 and composite >= 75:
        signal = "BUY"

    return {"signal": signal, "composite": composite}


def _pct(v, nd=1):
    if v is None:
        return None
    return f"{v * 100:.{nd}f}%"


def _fmt(v, nd=1):
    if v is None:
        return None
    try:
        return f"{float(v):.{nd}f}"
    except (TypeError, ValueError):
        return str(v)