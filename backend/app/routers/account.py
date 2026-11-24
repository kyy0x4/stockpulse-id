"""Data per-user: watchlist & portofolio (semua endpoint butuh login/JWT)."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.services import auth as a

router = APIRouter(prefix="/api", tags=["account"])


class PlanIn(BaseModel):
    plan: str = Field(pattern="^(free|pro|enterprise)$")


@router.post("/account/plan")
def set_plan(body: PlanIn, user: dict = Depends(a.get_current_user)):
    """Upgrade/downgrade plan (stub). Implementasi nyata pakai Stripe webhooks.
    
    Saat ini update field plan di profil. Setelah Stripe live, endpoint ini
    jadi callback webhook dari Stripe.
    """
    a._client().table("profiles").update({"plan": body.plan}).eq("id", user["id"]).execute()
    user["plan"] = body.plan
    return {"ok": True, "plan": body.plan}


class WatchIn(BaseModel):
    ticker: str = Field(min_length=1, max_length=6)


class TradeIn(BaseModel):
    ticker: str = Field(min_length=1, max_length=6)
    side: str
    qty: float = Field(gt=0)
    price: float = Field(gt=0)
    fee: float = Field(default=0, ge=0)
    trade_date: Optional[date] = None


def _norm_ticker(t: str) -> str:
    t = (t or "").strip().upper()
    if not t:
        raise HTTPException(422, "Ticker wajib diisi.")
    return t


# --------------------------------------------------------------------------- #
# Watchlist
# --------------------------------------------------------------------------- #
@router.get("/watchlist")
def get_watchlist(user: dict = Depends(a.get_current_user)):
    res = a._client().table("watchlist").select("ticker").eq("user_id", user["id"]).order("created_at").execute()
    return {"tickers": [r["ticker"] for r in (res.data or [])]}


@router.post("/watchlist")
def add_watchlist(body: WatchIn, user: dict = Depends(a.get_current_user)):
    ticker = _norm_ticker(body.ticker)
    res = a._client().table("watchlist").select("ticker").eq("user_id", user["id"]).eq("ticker", ticker).execute()
    if not (res.data or []):
        a._client().table("watchlist").insert({"user_id": user["id"], "ticker": ticker}).execute()
    return {"ok": True, "ticker": ticker}


@router.delete("/watchlist/{ticker}")
def remove_watchlist(ticker: str, user: dict = Depends(a.get_current_user)):
    a._client().table("watchlist").delete().eq("user_id", user["id"]).eq("ticker", _norm_ticker(ticker)).execute()
    return {"ok": True}


# --------------------------------------------------------------------------- #
# Portfolio
# --------------------------------------------------------------------------- #
def _quote_prices(tickers):
    """Map ticker → (price, change) dari snapshot stock_quotes."""
    if not tickers:
        return {}
    try:
        res = a._client().table("stock_quotes").select("ticker, price, change").in_("ticker", tickers).execute()
        return {r["ticker"]: (r.get("price"), r.get("change")) for r in (res.data or [])}
    except Exception:
        return {}


@router.get("/portfolio")
def get_portfolio(user: dict = Depends(a.get_current_user)):
    res = a._client().table("portfolio_holdings").select("*").eq("user_id", user["id"]).order("ticker").execute()
    holdings = res.data or []
    prices = _quote_prices([h["ticker"] for h in holdings])

    rows = []
    total_invested = total_value = 0.0
    for h in holdings:
        qty = float(h.get("qty") or 0)
        avg = float(h.get("avg_cost") or 0)
        price, change = prices.get(h["ticker"], (None, None))
        invested = qty * avg
        value = qty * price if price is not None else None
        pnl = (value - invested) if value is not None else None
        pnl_pct = ((price / avg) - 1) * 100 if price is not None and avg else None
        if value is not None:
            total_invested += invested
            total_value += value
        rows.append(
            {
                "ticker": h["ticker"],
                "qty": qty,
                "avg_cost": round(avg, 2),
                "price": price,
                "change": change,
                "invested": round(invested, 2),
                "value": round(value, 2) if value is not None else None,
                "pnl": round(pnl, 2) if pnl is not None else None,
                "pnl_pct": round(pnl_pct, 2) if pnl_pct is not None else None,
            }
        )

    return {
        "holdings": rows,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_value": round(total_value, 2),
            "total_pnl": round(total_value - total_invested, 2),
            "total_pnl_pct": round(((total_value / total_invested) - 1) * 100, 2) if total_invested else 0,
        },
    }


@router.get("/portfolio/trades")
def get_trades(user: dict = Depends(a.get_current_user)):
    res = (
        a._client()
        .table("portfolio_trades")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )
    return {"trades": res.data or []}


@router.post("/portfolio/trades")
def add_trade(body: TradeIn, user: dict = Depends(a.get_current_user)):
    ticker = _norm_ticker(body.ticker)
    side = body.side.lower()
    if side not in ("buy", "sell"):
        raise HTTPException(422, "side harus 'buy' atau 'sell'.")
    qty = body.qty
    price = body.price
    fee = body.fee or 0
    trade_date = body.trade_date or date.today()

    hold_res = (
        a._client().table("portfolio_holdings").select("*").eq("user_id", user["id"]).eq("ticker", ticker).execute()
    )
    holding = (hold_res.data or [None])[0]

    if side == "sell":
        have = float((holding or {}).get("qty") or 0)
        if have < qty:
            raise HTTPException(400, f"Jumlah jual melebihi posisi. Kamu hanya punya {have:g} lot.")
        new_qty = have - qty
        avg = float((holding or {}).get("avg_cost") or 0)
        realized = (price - avg) * qty - fee
        if new_qty <= 0.0001:
            if holding:
                a._client().table("portfolio_holdings").delete().eq("id", holding["id"]).execute()
            else:
                new_qty = 0
        else:
            a._client().table("portfolio_holdings").update({"qty": new_qty}).eq("id", holding["id"]).execute()
    else:
        have = float((holding or {}).get("qty") or 0)
        old_avg = float((holding or {}).get("avg_cost") or 0)
        new_qty = have + qty
        new_avg = ((old_avg * have) + (price * qty) + fee) / new_qty
        if holding:
            a._client().table("portfolio_holdings").update({"qty": new_qty, "avg_cost": round(new_avg, 4)}).eq(
                "id", holding["id"]
            ).execute()
        else:
            a._client().table("portfolio_holdings").insert(
                {"user_id": user["id"], "ticker": ticker, "qty": qty, "avg_cost": round(new_avg, 4)}
            ).execute()

    trade_res = a._client().table("portfolio_trades").insert(
        {
            "user_id": user["id"],
            "ticker": ticker,
            "side": side,
            "qty": qty,
            "price": price,
            "fee": fee,
            "trade_date": str(trade_date),
        }
    ).execute()

    return {
        "ok": True,
        "trade": (trade_res.data or [{}])[0],
        "realized_pnl": round(realized, 2) if side == "sell" else None,
    }