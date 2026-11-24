"""Rate limiting middleware (per IP + per user if logged in).

Default limits:
- Free: 60 req/min
- Pro: 300 req/min
- Enterprise: 1000 req/min

Set env vars:
- RATE_LIMIT_ENABLED: "true" (default) or "false"
- RATE_LIMIT_FREE: 60
- RATE_LIMIT_PRO: 300
- RATE_LIMIT_ENTERPRISE: 1000
"""

import os
import time
from typing import Optional

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.services import cache


def _get_user_plan(request: Request) -> Optional[str]:
    """Extract plan from JWT if present (best-effort, non-blocking)."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        # Quick decode (no signature verification here — middleware is fast)
        import jwt
        payload = jwt.decode(token, os.getenv("AUTH_SECRET", ""), algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            return None
        # Query plan from cache or DB (best-effort)
        key = f"user:plan:{user_id}"
        plan = cache.get(key)
        if plan:
            return plan.get("plan", "free")
        return "free"
    except Exception:
        return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter (per IP). For production, replace with Redis."""

    def __init__(self, app):
        super().__init__(app)
        self.enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
        self.limits = {
            "free": int(os.getenv("RATE_LIMIT_FREE", "60")),
            "pro": int(os.getenv("RATE_LIMIT_PRO", "300")),
            "enterprise": int(os.getenv("RATE_LIMIT_ENTERPRISE", "1000")),
        }
        # In-memory: {ip: [timestamps]}
        self._hits = {}
        self._lock = __import__("threading").Lock()

    async def dispatch(self, request: Request, call_next):
        if not self.enabled:
            return await call_next(request)

        # Skip rate limit for health/check
        if request.url.path in ("/api/health", "/api/warm"):
            return await call_next(request)

        # Get client IP
        ip = request.headers.get("X-Forwarded-For", request.client.host)
        if "," in ip:
            ip = ip.split(",")[0].strip()

        # Determine limit based on user plan (if logged in)
        plan = _get_user_plan(request)
        limit = self.limits.get(plan, self.limits["free"])

        # Check rate limit
        now = time.time()
        window_start = now - 60  # 1-minute window
        with self._lock:
            # Clean old entries
            if ip in self._hits:
                self._hits[ip] = [t for t in self._hits[ip] if t > window_start]
            else:
                self._hits[ip] = []

            if len(self._hits[ip]) >= limit:
                # Rate limit exceeded
                retry_after = 60 - int(now - self._hits[ip][0])
                return JSONResponse(
                    {"error": "Rate limit exceeded", "retry_after": max(retry_after, 1)},
                    status_code=429,
                    headers={"Retry-After": str(max(retry_after, 1))},
                )

            # Record hit
            self._hits[ip].append(now)

        return await call_next(request)


from fastapi.responses import JSONResponse  # noqa: E402
