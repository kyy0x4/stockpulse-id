"""Autentikasi PulseTerminal.

Dua alur masuk:
1. Email + password — aktivasi lewat kode OTP 6 digit yang dikirim via Resend
   (template HTML dibuat di sini, full kendali desain).
2. Google — login via Supabase Auth di frontend, token divalidasi ke
   /auth/v1/user, lalu profil di-upsert ke tabel `profiles`.

Sesi memakai JWT (pyjwt, HS256, env AUTH_SECRET). Semua data user disimpan
di Supabase dan hanya diakses backend (service role).
"""

import hashlib
import hmac
import os
import re
import secrets
import time

import jwt
import requests

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

URL = os.getenv("SUPABASE_URL", "").strip()
ANON_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_SERVICE_KEY", "")).strip()
AUTH_SECRET = os.getenv("AUTH_SECRET", "").strip()
RESEND_KEY = os.getenv("RESEND_API_KEY", "").strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", "PulseTerminal <noreply@plotfinansial.com>").strip()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
SESSION_TTL = 60 * 60 * 24 * 7  # 7 hari
OTP_TTL = 10 * 60  # 10 menit
OTP_ATTEMPTS = 5

_bearer = HTTPBearer(auto_error=False)

_ERR_AUTH_NOT_READY = "Autentikasi belum aktif. Set AUTH_SECRET di environment."


# --------------------------------------------------------------------------- #
# Password (PBKDF2-SHA256, stdlib — tanpa dependency ekstra)
# --------------------------------------------------------------------------- #
def hash_password(password: str, iterations: int = 210_000) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), iterations
    ).hex()
    return f"pbkdf2${iterations}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, digest = stored.split("$")
        check = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations)
        ).hex()
        return hmac.compare_digest(check, digest)
    except (ValueError, TypeError):
        return False


# --------------------------------------------------------------------------- #
# OTP
# --------------------------------------------------------------------------- #
def make_otp(n: int = 6) -> str:
    return f"{secrets.randbelow(10 ** n):0{n}d}"


def hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


# --------------------------------------------------------------------------- #
# JWT
# --------------------------------------------------------------------------- #
def create_token(profile_id: str) -> str:
    if not AUTH_SECRET:
        raise HTTPException(503, _ERR_AUTH_NOT_READY)
    return jwt.encode(
        {"sub": str(profile_id), "iat": int(time.time()), "exp": int(time.time()) + SESSION_TTL},
        AUTH_SECRET,
        algorithm="HS256",
    )


def decode_token(token: str):
    if not AUTH_SECRET:
        raise HTTPException(503, _ERR_AUTH_NOT_READY)
    try:
        return jwt.decode(token, AUTH_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Sesi tidak valid atau kedaluwarsa")


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
):
    if creds is None or not creds.credentials:
        raise HTTPException(401, "Harus login dulu")
    require_db()
    payload = decode_token(creds.credentials)
    user = _get_profile(payload.get("sub"))
    if user is None:
        raise HTTPException(401, "Akun tidak ditemukan")
    return user


def require_db():
    from app.services.supabase import available

    if not available():
        raise HTTPException(503, "Autentikasi butuh Supabase. Set SUPABASE_URL & SUPABASE_SERVICE_KEY dulu.")


# --------------------------------------------------------------------------- #
# Supabase helpers
# --------------------------------------------------------------------------- #
def _client():
    from app.services.supabase import _client as sb

    return sb()


def _get_profile(profile_id: str):
    try:
        res = _client().table("profiles").select("*").eq("id", str(profile_id)).maybe_single().execute()
        return res.data if res and res.data else None
    except Exception:
        return None


def _get_profile_by_email(email: str):
    # Jangan telan error koneksi: login harus membedakan "user tidak ada" dari
    # "database tidak bisa diakses", bukan selalu bilang password salah.
    res = _client().table("profiles").select("*").eq("email", email.lower()).maybe_single().execute()
    return res.data if res and res.data else None


# --------------------------------------------------------------------------- #
# Email verifikasi (Resend) — template HTML berdesain terminal
# --------------------------------------------------------------------------- #
def build_verification_email(name: str, code: str):
    first = name.strip().split(" ")[0] if name and name.strip() else "Trader"
    app_name = "PULSETERMINAL"
    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kode Verifikasi {app_name}</title>
  </head>
  <body style="margin:0;padding:0;background:#080809;font-family:'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080809;">
      <tr><td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr><td style="padding:0 0 24px;text-align:center;">
            <div style="font-family:monospace;font-size:10px;letter-spacing:6px;color:#44444c;text-transform:uppercase;margin-bottom:6px;">
              SAHAM AS &middot; KRIPTO &middot; REAL-TIME
            </div>
            <div style="font-family:'Arial Black',Arial,sans-serif;font-size:30px;font-weight:900;letter-spacing:2px;color:#eeebe4;">
              {app_name}
            </div>
          </td></tr>
          <tr><td style="border:1px solid #222226;border-left:3px solid #c8ff00;background:#0e0e10;padding:32px 28px;">
            <div style="font-family:monospace;font-size:11px;letter-spacing:3px;color:#c8ff00;text-transform:uppercase;margin-bottom:14px;">
              Verifikasi Akun
            </div>
            <div style="font-size:22px;font-weight:700;color:#eeebe4;margin-bottom:10px;">
              Hai, {first}!
            </div>
            <div style="font-size:14px;line-height:1.7;color:#888890;">
              Pakai kode di bawah untuk mengaktifkan akun kamu. Kode berlaku
              <b style="color:#eeebe4;">10 menit</b> dan hanya untuk sekali pakai.
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr><td align="center" style="border:1px dashed #3a3a3a;background:#141416;padding:18px;">
                <div style="font-family:monospace;font-size:34px;font-weight:700;letter-spacing:14px;color:#c8ff00;text-align:center;padding-left:14px;">
                  {code}
                </div>
              </td></tr>
            </table>
            <div style="font-size:12px;line-height:1.6;color:#44444c;">
              Tidak meminta kode ini? Abaikan email ini — akun kamu tetap aman.<br/>
              &copy; {time.strftime('%Y')} {app_name} &middot; Perkakas analisa saham Indonesia.
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>"""


def send_verification_email(to: str, name: str, code: str) -> bool:
    if not RESEND_KEY:
        print(f"[auth] RESEND_API_KEY kosong, email ke {to} tidak terkirim (kode={code})")
        return False
    try:
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_KEY}", "Content-Type": "application/json"},
            json={
                "from": EMAIL_FROM,
                "to": [to],
                "subject": f"[{code}] Kode verifikasi PulseTerminal",
                "html": build_verification_email(name, code),
            },
            timeout=15,
        )
        if resp.status_code >= 400:
            print(f"[auth] resend gagal {resp.status_code}: {resp.text[:300]}")
            return False
        return True
    except Exception as exc:
        print(f"[auth] resend error: {exc}")
        return False


# --------------------------------------------------------------------------- #
# Google (via Supabase Auth)
# --------------------------------------------------------------------------- #
def validate_google_token(access_token: str):
    """Validasi token akses Supabase Auth → return user dict atau None."""
    if not URL or not ANON_KEY:
        return None
    try:
        resp = requests.get(
            f"{URL}/auth/v1/user",
            headers={"apikey": ANON_KEY, "Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        if resp.status_code != 200:
            print(f"[auth] google token invalid: {resp.status_code} {resp.text[:200]}")
            return None
        data = resp.json()
        email = (data.get("email") or "").lower()
        if not email:
            return None
        meta = data.get("user_metadata") or {}
        return {
            "email": email,
            "name": data.get("user_metadata", {}).get("name")
            or data.get("user_metadata", {}).get("full_name")
            or email.split("@")[0],
            "avatar_url": data.get("user_metadata", {}).get("avatar_url")
            or data.get("user_metadata", {}).get("picture"),
            "google_id": str(data.get("id") or ""),
            "is_confirmed": bool(data.get("email_confirmed_at") or data.get("confirmed_at") or data.get("aud") == "authenticated"),
        }
    except Exception as exc:
        print(f"[auth] validate_google_token error: {exc}")
        return None


# --------------------------------------------------------------------------- #
# OTP store
# --------------------------------------------------------------------------- #
def save_code(email: str, code: str, purpose: str = "verify"):
    """Simpan kode OTP (hash). Hapus kode lama milik email tsb dulu."""
    _client().table("auth_codes").delete().eq("email", email).execute()
    _client().table("auth_codes").insert(
        {
            "email": email,
            "code_hash": hash_otp(code),
            "purpose": purpose,
            "expires_at": _ts_iso(time.time() + OTP_TTL),
        }
    ).execute()


def consume_code(email: str, code: str, purpose: str = "verify") -> bool:
    """Validasi + pakai kode. Tambah attempts pada gagal, hapus bila berhasil."""
    res = _client().table("auth_codes").select("*").eq("email", email).eq("purpose", purpose).execute()
    rows = res.data or []
    if not rows:
        return False
    row = sorted(rows, key=lambda r: r.get("created_at") or "", reverse=True)[0]
    if row.get("attempts", 0) >= OTP_ATTEMPTS:
        _client().table("auth_codes").delete().eq("id", row["id"]).execute()
        return False
    if _expired(row):
        _client().table("auth_codes").delete().eq("id", row["id"]).execute()
        return False
    if not hmac.compare_digest(str(row.get("code_hash") or ""), hash_otp(code)):
        _client().table("auth_codes").update({"attempts": int(row.get("attempts", 0)) + 1}).eq("id", row["id"]).execute()
        return False
    _client().table("auth_codes").delete().eq("id", row["id"]).execute()
    return True


def _expired(row) -> bool:
    try:
        from datetime import datetime, timezone

        exp = row.get("expires_at")
        if not exp:
            return True
        if isinstance(exp, str):
            exp = datetime.fromisoformat(exp.replace("Z", "+00:00"))
        return exp < datetime.now(timezone.utc)
    except Exception:
        return False


def _ts_iso(ts: float) -> str:
    from datetime import datetime, timezone

    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
