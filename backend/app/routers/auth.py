"""Endpoint autentikasi: register (email+OTP), verify, login, Google, me."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse

from app.services import auth as a

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _check_email(email: str) -> str:
    email = (email or "").strip().lower()
    if not a.EMAIL_RE.match(email):
        raise HTTPException(422, "Format email tidak valid.")
    return email


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str
    password: str = Field(min_length=8, max_length=100)


class VerifyIn(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)


class EmailIn(BaseModel):
    email: str


class LoginIn(BaseModel):
    email: str
    password: str


class GoogleIn(BaseModel):
    provider: str = "google"
    access_token: str


def _public(profile) -> dict:
    return {
        "id": profile.get("id"),
        "email": profile.get("email"),
        "name": profile.get("name") or profile.get("email", "").split("@")[0],
        "provider": profile.get("provider") or "email",
        "is_verified": bool(profile.get("is_verified")),
        "avatar_url": profile.get("avatar_url"),
        "created_at": profile.get("created_at"),
    }


def _token_response(profile) -> JSONResponse:
    return JSONResponse(
        {"token": a.create_token(profile["id"]), "user": _public(profile)},
        headers={"Cache-Control": "no-store"},
    )


@router.post("/register")
def register(body: RegisterIn):
    a.require_db()
    email = _check_email(body.email)
    existing = a._get_profile_by_email(email)
    if existing:
        if (existing.get("provider") or "email") == "google":
            raise HTTPException(409, "Email ini sudah terdaftar lewat Google. Silakan login pakai Google.")
        if existing.get("is_verified"):
            raise HTTPException(409, "Email ini sudah terdaftar. Silakan login.")
    else:
        a._client().table("profiles").insert(
            {
                "email": email,
                "name": body.name.strip(),
                "password_hash": a.hash_password(body.password),
                "provider": "email",
                "is_verified": False,
            }
        ).execute()

    code = a.make_otp()
    a.save_code(email, code)
    sent = a.send_verification_email(email, body.name, code)
    return JSONResponse(
        {
            "message": "Kode verifikasi dikirim ke email kamu.",
            "email": email,
            "sent": sent,
            "ttl_minutes": a.OTP_TTL // 60,
        },
        status_code=201,
    )


@router.post("/verify")
def verify(body: VerifyIn):
    a.require_db()
    email = _check_email(body.email)
    profile = a._get_profile_by_email(email)
    if profile is None:
        raise HTTPException(404, "Email belum terdaftar. Daftar dulu ya.")
    if profile.get("is_verified"):
        raise HTTPException(409, "Akun ini sudah aktif. Silakan login.")

    if not a.consume_code(email, body.code):
        raise HTTPException(400, "Kode salah atau sudah kedaluwarsa.")

    a._client().table("profiles").update({"is_verified": True}).eq("id", profile["id"]).execute()
    profile["is_verified"] = True
    return _token_response(profile)


@router.post("/resend")
def resend(body: EmailIn):
    a.require_db()
    email = _check_email(body.email)
    profile = a._get_profile_by_email(email)
    if profile is None:
        raise HTTPException(404, "Email belum terdaftar.")
    if profile.get("is_verified"):
        raise HTTPException(409, "Akun sudah aktif.")

    code = a.make_otp()
    a.save_code(email, code)
    sent = a.send_verification_email(email, profile.get("name") or email, code)
    return {"message": "Kode verifikasi baru sudah dikirim.", "sent": sent}


@router.post("/login")
def login(body: LoginIn):
    a.require_db()
    email = _check_email(body.email)
    profile = a._get_profile_by_email(email)
    if profile is None:
        raise HTTPException(401, "Email atau password salah.")
    if (profile.get("provider") or "email") == "google":
        raise HTTPException(409, "Akun ini memakai login Google.")
    if not profile.get("password_hash") or not a.verify_password(body.password, profile["password_hash"]):
        raise HTTPException(401, "Email atau password salah.")
    if not profile.get("is_verified"):
        return JSONResponse({"needs_verification": True, "email": email})
    return _token_response(profile)


@router.post("/google")
def google(body: GoogleIn):
    a.require_db()
    data = a.validate_google_token(body.access_token)
    if data is None:
        raise HTTPException(401, "Token Google/Supabase tidak valid.")
    email = data["email"]
    existing = a._get_profile_by_email(email)
    if existing and (existing.get("provider") or "email") == "email" and existing.get("is_verified"):
        raise HTTPException(409, "Email ini sudah terdaftar dengan password. Silakan login pakai password.")

    if existing is None:
        row = a._client().table("profiles").insert(
            {
                "email": email,
                "name": data["name"],
                "provider": "google",
                "google_id": data.get("google_id"),
                "avatar_url": data.get("avatar_url"),
                "is_verified": True,
            }
        ).execute()
        profile = row.data[0] if row.data else a._get_profile_by_email(email)
    else:
        a._client().table("profiles").update(
            {
                "provider": "google",
                "google_id": data.get("google_id") or existing.get("google_id"),
                "avatar_url": data.get("avatar_url") or existing.get("avatar_url"),
                "name": data["name"] or existing.get("name"),
                "is_verified": True,
            }
        ).eq("id", existing["id"]).execute()
        profile = a._get_profile_by_email(email)
    return _token_response(profile)


@router.get("/me")
def me(user: dict = Depends(a.get_current_user)):
    return {"user": _public(user)}