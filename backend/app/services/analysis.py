import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Fundamental: pendekatan institusional / hedge fund
# ---------------------------------------------------------------------------
# Model kualitas (Quality-at-a-reasonable-price) yang dipakai investor besar:
#   1. KUALITAS BISNIS (quality) — profitabilitas & efisiensi modal
#   2. ARUS KAS & VALUATION — free cash flow yield, harga wajar relatif
#   3. PERTUMBUHAN — earnings & revenue growth + PEG
#   4. KESEHATAN KEUANGAN — leverage & likuiditas
#   5. SENTIMEN INSTITUSIONAL — target harga analis & rekomendasi
# ---------------------------------------------------------------------------


def _score_dir(value, direction, good, mid, bad, default=30, score_good=95, score_mid=65, score_bad=40, score_low=20):
    """Skor value berdasarkan arah (">": semakin besar semakin baik, "<": kebalikan)."""
    if value is None:
        return default
    if direction == ">":
        if value >= good:
            return score_good
        if value >= mid:
            return score_mid
        if value >= bad:
            return score_bad
        return score_low
    if value <= good:
        return score_good
    if value <= mid:
        return score_mid
    if value <= bad:
        return score_bad
    return score_low


def score_fundamental(info):
    pe = info.get("trailing_pe")
    fwd_pe = info.get("forward_pe")
    pbv = info.get("price_to_book")
    roe = info.get("return_on_equity")
    roa = info.get("return_on_assets")
    der = info.get("debt_to_equity")
    current_ratio = info.get("current_ratio")
    growth = info.get("earnings_growth")
    rev_growth = info.get("revenue_growth")
    profit_margin = info.get("profit_margins")
    op_margin = info.get("operating_margins")
    fcf = info.get("free_cashflow")
    market_cap = info.get("market_cap")
    target_price = info.get("target_mean_price")
    price = info.get("price") or _price_from_history(info)

    # --- 1. QUALITY (35%) --------------------------------------------------
    # ROIC tidak tersedia langsung dari Yahoo summary; gunakan proksi
    # Return on Capital = NOPAT / (Equity + Debt) via ROE & leverage.
    fcf_yield = (fcf / market_cap) if fcf is not None and market_cap else None
    roic_proxy = roe  # fallback, idealnya dari laporan keuangan

    q_roe = _score_dir(roe, ">", 0.18, 0.10, 0.04, default=30, score_good=95, score_mid=70, score_bad=45)
    q_roa = _score_dir(roa, ">", 0.10, 0.05, 0.01, default=30, score_good=95, score_mid=70, score_bad=45)
    q_margin = _score_dir(profit_margin, ">", 0.20, 0.10, 0.02, default=30, score_good=95, score_mid=70, score_bad=45)
    q_op = _score_dir(op_margin, ">", 0.22, 0.12, 0.03, default=30, score_good=90, score_mid=70, score_bad=45)
    q_cash = _score_dir(fcf_yield, ">", 0.05, 0.03, 0.005, default=25, score_good=95, score_mid=70, score_bad=45)

    quality = {
        "ROE": q_roe,
        "ROA": q_roa,
        "Net margin": q_margin,
        "Operating margin": q_op,
        "FCF yield": q_cash,
    }

    # --- 2. VALUATION (30%) ------------------------------------------------
    # PER dibaca relatif terhadap pertumbuhan (PEG), bukan absolut.
    peg = (pe / (growth * 100)) if pe is not None and growth not in (None, 0) else None
    v_pe = _score_dir(pe, "<", 12, 20, 35, default=45, score_good=90, score_mid=65, score_bad=40)
    v_pbv = _score_dir(pbv, "<", 1.5, 2.8, 5.0, default=40, score_good=90, score_mid=65, score_bad=40)
    v_peg = _score_dir(peg, "<", 1.0, 1.5, 2.5, default=45, score_good=90, score_mid=65, score_bad=40)
    v_fcfy = _score_dir(fcf_yield, ">", 0.06, 0.035, 0.01, default=35, score_good=95, score_mid=70, score_bad=45)

    valuation = {
        "PER": v_pe,
        "PBV": v_pbv,
        "PEG": v_peg,
        "FCF yield": v_fcfy,
    }

    # --- 3. PERTUMBUHAN (20%) ----------------------------------------------
    g_eps = _score_dir(growth, ">", 0.15, 0.06, 0.0, default=35, score_good=95, score_mid=70, score_bad=45)
    g_rev = _score_dir(rev_growth, ">", 0.12, 0.05, 0.0, default=35, score_good=90, score_mid=70, score_bad=45)
    growth_block = {"Growth laba": g_eps, "Pertumbuhan revenue": g_rev}

    # --- 4. FINANCIAL HEALTH (15%) -----------------------------------------
    h_der = _score_dir(der, "<", 0.6, 1.0, 2.0, default=50, score_good=90, score_mid=70, score_bad=45)
    h_liq = _score_dir(current_ratio, ">", 1.8, 1.2, 0.8, default=45, score_good=90, score_mid=70, score_bad=45)
    health = {"DER": h_der, "Current ratio": h_liq}

    # --- 5. SENTIMEN INSTITUSIONAL (bonus, ±10) ----------------------------
    sentiment = 0
    rec = (info.get("recommendation") or "").lower()
    if rec in ("strong_buy", "buy"):
        sentiment += 8
    elif rec in ("strong_sell", "sell"):
        sentiment -= 8
    if target_price and price:
        upside = (target_price - price) / price
        if upside > 0.15:
            sentiment += 7
        elif upside < -0.10:
            sentiment -= 7

    # --- AGREGASI -----------------------------------------------------------
    weights = {
        "quality": 0.35,
        "valuation": 0.30,
        "growth": 0.20,
        "health": 0.15,
    }
    q_score = sum(quality.values()) / len(quality)
    v_score = sum(valuation.values()) / len(valuation)
    g_score = sum(growth_block.values()) / len(growth_block)
    h_score = sum(health.values()) / len(health)

    total = q_score * weights["quality"] + v_score * weights["valuation"] + \
        g_score * weights["growth"] + h_score * weights["health"] + sentiment
    total = max(0, min(100, round(total)))

    if total >= 82:
        rating = "sangat menarik"
    elif total >= 70:
        rating = "menarik"
    elif total >= 60:
        rating = "cukup"
    elif total >= 45:
        rating = "lemah"
    else:
        rating = "buruk"

    return {
        "score": total,
        "rating": rating,
        "components": {
            **{k: v for k, v in sorted(quality.items(), key=lambda x: -x[1])},
            **{k: v for k, v in sorted(valuation.items(), key=lambda x: -x[1])},
            **{k: v for k, v in sorted(growth_block.items(), key=lambda x: -x[1])},
            **{k: v for k, v in sorted(health.items(), key=lambda x: -x[1])},
        },
        "pillars": {
            "Kualitas bisnis": round(q_score),
            "Valuation": round(v_score),
            "Pertumbuhan": round(g_score),
            "Kesehatan finansial": round(h_score),
        },
        "metrics": {
            "per": _fmt(pe, 1),
            "fwd_pe": _fmt(fwd_pe, 1),
            "pbv": _fmt(pbv, 2),
            "roe": _pct(roe, 1),
            "roa": _pct(roa, 1),
            "der": _fmt(der, 2),
            "net_margin": _pct(profit_margin, 1),
            "op_margin": _pct(op_margin, 1),
            "growth": _pct(growth, 1),
            "revenue_growth": _pct(rev_growth, 1),
            "fcf_yield": _pct(fcf_yield, 1),
            "peg": _fmt(peg, 2),
        },
    }


def _price_from_history(info):
    try:
        return info["audit_raw"].get("currentPrice") or info["audit_raw"].get("regularMarketPrice")
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Teknikal: market structure (SMC) + EMA 21/34/55
# ---------------------------------------------------------------------------
# Pendekatan yang dipakai trader institusional / smart money:
#   1. MARKET STRUCTURE — swing high/low, higher highs/lows, BOS & CHoCH
#   2. EMA 21 / 34 / 55 (Fibonacci) — alinyemen & persilangan
#   3. MOMENTUM — RSI & MACD sebagai konfirmasi
#   4. VOLUME — rasio volume sebagai konfirmasi kekuatan
# ---------------------------------------------------------------------------


def score_technical(history):
    if not history or len(history) < 55:
        return {
            "score": None,
            "trend": "Data tidak cukup",
            "rsi": None,
            "macd": "N/A",
            "vol_ratio": None,
            "ema21": None,
            "ema34": None,
            "ema55": None,
            "structure": "N/A",
            "close": None,
            "note": "Perlu minimal 55 hari data (EMA 55)",
        }

    df = pd.DataFrame(history)
    close = df["close"].astype(float)
    volume = df["volume"].astype(float) if "volume" in df else None

    # --- EMA 21 / 34 / 55 (Fibonacci) --------------------------------------
    ema21 = float(close.ewm(span=21, adjust=False).mean().iloc[-1])
    ema34 = float(close.ewm(span=34, adjust=False).mean().iloc[-1])
    ema55 = float(close.ewm(span=55, adjust=False).mean().iloc[-1])

    price = float(close.iloc[-1])
    ema_score = _ema_alignment_score(price, ema21, ema34, ema55)

    # --- MARKET STRUCTURE ---------------------------------------------------
    structure, bos, choch = _market_structure(df, price)

    # --- MOMENTUM (RSI + MACD) ---------------------------------------------
    rsi = _compute_rsi(close)
    macd_cross, macd_positive = _compute_macd(close)

    rsi_score = _rsi_score(rsi)
    macd_score = 90 if macd_cross == "Bullish" and macd_positive else 70 if macd_cross == "Bullish" else 35

    # --- VOLUME ---------------------------------------------------------------
    vol_ratio = None
    vol_score = 50
    if volume is not None:
        vol_avg = float(volume.rolling(20).mean().iloc[-1])
        vol_last = float(volume.iloc[-1])
        if vol_avg and vol_last:
            vol_ratio = round(vol_last / vol_avg, 2)
            vol_score = _vol_score(vol_ratio)

    # --- AGREGASI -------------------------------------------------------------
    structure_score = _structure_score(structure, bos, choch)
    weights = {
        "structure": 0.40,
        "ema": 0.30,
        "momentum": 0.20,
        "volume": 0.10,
    }
    total = round(
        structure_score * weights["structure"]
        + ema_score * weights["ema"]
        + (max(rsi_score, macd_score)) * weights["momentum"]
        + vol_score * weights["volume"]
    )
    total = max(0, min(100, total))

    trend = _trend_label(structure, price, ema21, ema34, ema55)

    return {
        "score": total,
        "trend": trend,
        "rsi": round(rsi, 1),
        "macd": macd_cross,
        "vol_ratio": vol_ratio,
        "ema21": _fmt(ema21, 0),
        "ema34": _fmt(ema34, 0),
        "ema55": _fmt(ema55, 0),
        "close": _fmt(price, 0),
        "structure": structure,
        "bos": bos,
        "choch": choch,
        "components": {
            "Market structure": structure_score,
            "EMA 21/34/55": ema_score,
            "RSI": rsi_score,
            "MACD": macd_score,
            "Volume": vol_score,
        },
    }


def _ema_alignment_score(price, ema21, ema34, ema55):
    score = 50
    aligned_up = ema21 > ema34 > ema55
    aligned_down = ema21 < ema34 < ema55
    if price > ema21:
        score += 20
    if price > ema55:
        score += 20
    if aligned_up:
        score += 25
    elif aligned_down:
        score -= 25
    if ema21 > ema55:
        score += 10
    else:
        score -= 10
    return max(0, min(100, score))


def _market_structure(df, price):
    """Deteksi swing high/low + Break of Structure (BOS) + Change of Character (CHoCH)."""
    close = df["close"].astype(float).tolist()
    n = len(close)
    if n < 20:
        return "Sideways", "N/A", "N/A"

    # Swing detection: fractal (2 bar kiri & kanan)
    swings = []
    for i in range(2, n - 2):
        window = close[i - 2:i + 3]
        if close[i] == max(window):
            swings.append((i, close[i], "high"))
        elif close[i] == min(window):
            swings.append((i, close[i], "low"))

    lows = [(i, v) for i, v, k in swings if k == "low"]
    highs = [(i, v) for i, v, k in swings if k == "high"]
    if len(lows) < 3 or len(highs) < 3:
        return "Sideways", "N/A", "N/A"

    recent_lows = lows[-3:]
    recent_highs = highs[-3:]
    hh = recent_highs[-1][1] > recent_highs[-2][1] if len(recent_highs) >= 2 else False
    ll = recent_lows[-1][1] < recent_lows[-2][1] if len(recent_lows) >= 2 else False

    prior_high = recent_highs[-2][1] if len(recent_highs) >= 2 else recent_highs[-1][1]
    prior_low = recent_lows[-2][1] if len(recent_lows) >= 2 else recent_lows[-1][1]

    bos = "N/A"
    choch = "N/A"
    if price > prior_high:
        bos = "Bullish BOS"
    elif price < prior_low:
        bos = "Bearish BOS"

    if hh and price < prior_low:
        choch = "Bearish CHoCH"
    elif (not hh) and price > prior_high:
        choch = "Bullish CHoCH"

    if hh and not ll:
        return "Uptrend", bos, choch
    if ll and not hh:
        return "Downtrend", bos, choch
    return "Sideways", bos, choch


def _structure_score(structure, bos, choch):
    base = {"Uptrend": 75, "Sideways": 55, "Downtrend": 30}.get(structure, 50)
    if bos == "Bullish BOS":
        base += 15
    elif bos == "Bearish BOS":
        base -= 15
    if choch == "Bullish CHoCH":
        base += 10
    elif choch == "Bearish CHoCH":
        base -= 10
    return max(0, min(100, base))


def _trend_label(structure, price, ema21, ema34, ema55):
    if structure == "Uptrend" and price > ema21:
        return "Uptrend"
    if structure == "Downtrend" and price < ema21:
        return "Downtrend"
    if structure in ("Uptrend", "Downtrend"):
        return structure
    if ema21 > ema34 > ema55:
        return "Uptrend"
    if ema21 < ema34 < ema55:
        return "Downtrend"
    return "Sideways"


def _compute_rsi(close):
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    last = rsi.iloc[-1]
    return float(last) if not np.isnan(last) else 50.0


def _compute_macd(close):
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    cross = "Bullish" if macd_line.iloc[-1] > signal_line.iloc[-1] else "Bearish"
    positive = macd_line.iloc[-1] > 0
    return cross, positive


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