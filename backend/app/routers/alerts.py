"""Alerts per-user: price threshold + sinyal berubah (BUY/HOLD/SELL).

Semua endpoint butuh login/JWT. Limit per plan:
- free: 3 alert
- pro: 20 alert
- enterprise: unlimited

Semua data disimpan di Supabase `alerts` table (kolom: user_id, ticker,
type [price_above | price_below | signal_buy | signal_sell], value,
last_triggered_at, triggered, created_at, updated_at).

Polling cron akan cek alerts & trigger email/push ke user (di cron.py).
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.services import auth as a
from app.services import supabase as db

router = APIRouter(prefix="/api", tags=["alerts"])

ALERT_TYPES = ("price_above", "price_below", "signal_buy", "signal_sell")
PLAN_LIMITS = {"free": 3, "pro": 20, "enterprise": None}


class AlertIn(BaseModel):
    ticker: str = Field(min_length=1, max_length=6)
    type: str = Field(pattern="^(price_above|price_below|signal_buy|signal_sell)$")
    value: Optional[float] = None  # required untuk price_above/price_below


def _norm_ticker(t: str) -> str:
    t = (t or "").strip().upper()
    if not t:
        raise HTTPException(422, "Ticker wajib diisi.")
    return t


def _check_plan(user: dict) -> int:
    plan = user.get("plan", "free")
    limit = PLAN_LIMITS.get(plan)
    return limit


@router.get("/alerts")
def list_alerts(user: dict = Depends(a.get_current_user)):
    res = (
        a._client()
        .table("alerts")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return {"alerts": res.data or [], "limit": _check_plan(user)}


@router.post("/alerts")
def create_alert(body: AlertIn, user: dict = Depends(a.get_current_user)):
    ticker = _norm_ticker(body.ticker)
    limit = _check_plan(user)
    if limit is not None:
        existing = (
            a._client()
            .table("alerts")
            .select("id")
            .eq("user_id", user["id"])
            .execute()
        )
        if len(existing.data or []) >= limit:
            raise HTTPException(
                403,
                f"Limit alert plan {user.get('plan','free').upper()} adalah {limit}. Upgrade ke Pro untuk 20 alert."
            )
    if body.type in ("price_above", "price_below") and body.value is None:
        raise HTTPException(422, "Value (harga target) wajib diisi untuk alert harga.")
    res = a._client().table("alerts").insert({
        "user_id": user["id"],
        "ticker": ticker,
        "type": body.type,
        "value": body.value,
        "triggered": False,
        "last_triggered_at": None,
    }).execute()
    return {"ok": True, "alert": (res.data or [None])[0]}


@router.delete("/alerts/{alert_id}")
def delete_alert(alert_id: int, user: dict = Depends(a.get_current_user)):
    a._client().table("alerts").delete().eq("id", alert_id).eq("user_id", user["id"]).execute()
    return {"ok": True}


@router.post("/alerts/{alert_id}/dismiss")
def dismiss_alert(alert_id: int, user: dict = Depends(a.get_current_user)):
    a._client().table("alerts").update({
        "triggered": False,
        "last_triggered_at": datetime.utcnow().isoformat(),
    }).eq("id", alert_id).eq("user_id", user["id"]).execute()
    return {"ok": True}


# ── helper untuk cron (di import di cron.py) ─────────────────
def check_alerts(quotes):
    """Dipanggil cron setiap poll: cek semua alerts aktif & trigger yang tembus.
    
    quotes: list result build_all (ticker, price, signal). Return: daftar
    (user_id, alert, message) yang harus dikirim notifikasi (email/push).
    """
    if not db.available():
        return []
    try:
        active = (
            db._client()
            .table("alerts")
            .select("*")
            .eq("triggered", False)
            .limit(500)
            .execute()
        )
        alerts = active.data or []
        if not alerts:
            return []
        quotes_map = {q.get("ticker"): q for q in quotes if q.get("ticker")}
        hits = []
        for al in alerts:
            ticker = al.get("ticker")
            q = quotes_map.get(ticker)
            if not q:
                continue
            triggered = False
            if al.get("type") == "price_above":
                if q.get("price") is not None and al.get("value") and q["price"] >= al["value"]:
                    triggered = True
            elif al.get("type") == "price_below":
                if q.get("price") is not None and al.get("value") and q["price"] <= al["value"]:
                    triggered = True
            elif al.get("type") == "signal_buy" and q.get("signal") == "BUY":
                triggered = True
            elif al.get("type") == "signal_sell" and q.get("signal") in ("SELL", "HOLD"):
                triggered = True
            if triggered:
                db._client().table("alerts").update({
                    "triggered": True,
                    "last_triggered_at": datetime.utcnow().isoformat(),
                }).eq("id", al["id"]).execute()
                hits.append((al.get("user_id"), al, q))
        return hits
    except Exception as e:
        print(f"[alerts] check_alerts gagal: {e}")
        return []
