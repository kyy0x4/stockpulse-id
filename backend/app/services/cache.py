"""Shared cache layer: Redis (production) / In-Memory (dev/local).

Set `REDIS_URL` di environment untuk pakai Redis. Kalau tidak ada,
fallback ke in-memory (aman untuk dev, tapi tidak shared antar instance).

API:
- get(key) → value or None
- set(key, value, ttl)
- invalidate(prefix="") → hapus semua key yang prefix
- health() → status
"""

import json
import os
import threading
import time

# Redis connection pool (lazy init)
_redis_client = None
_redis_lock = threading.Lock()

# In-memory fallback
_mem_cache = {}
_mem_lock = threading.Lock()


def _init_redis():
    """Lazy init Redis client. Return None if Redis not available."""
    global _redis_client
    url = os.getenv("REDIS_URL", "").strip()
    if not url:
        return None
    try:
        import redis
        if _redis_client is None:
            _redis_client = redis.Redis.from_url(url, decode_responses=True)
        _redis_client.ping()  # verify connection
        return _redis_client
    except Exception:
        print("[cache] Redis connection failed, falling back to in-memory")
        return None


def _use_redis():
    """Check if Redis should be used. Returns True if REDIS_URL is set."""
    return bool(os.getenv("REDIS_URL", "").strip())


def get(key):
    """Fetch value from cache. Returns None if not found or expired."""
    if _use_redis():
        try:
            client = _init_redis()
            if client:
                raw = client.get(f"miq:{key}")
                if raw:
                    return json.loads(raw)
                return None
        except Exception:
            pass
    # In-memory fallback
    with _mem_lock:
        entry = _mem_cache.get(key)
        if entry and entry["expires"] > time.time():
            return entry["value"]
        return None


def set(key, value, ttl=900):
    """Store value in cache with TTL (seconds)."""
    if _use_redis():
        try:
            client = _init_redis()
            if client:
                client.set(
                    f"miq:{key}",
                    json.dumps(value),
                    ex=ttl,
                )
                return
        except Exception:
            pass
    # In-memory fallback
    with _mem_lock:
        _mem_cache[key] = {"value": value, "expires": time.time() + ttl}


def invalidate(prefix=""):
    """Clear cache. If prefix given, only clear keys starting with that prefix."""
    if _use_redis():
        try:
            client = _init_redis()
            if client:
                if not prefix:
                    # Clear all miq:* keys
                    for key in client.scan_iter("miq:*"):
                        client.delete(key)
                else:
                    for key in client.scan_iter(f"miq:{prefix}*"):
                        client.delete(key)
                return
        except Exception:
            pass
    # In-memory fallback
    with _mem_lock:
        if not prefix:
            _mem_cache.clear()
        else:
            keys_to_delete = [k for k in _mem_cache if k.startswith(prefix)]
            for k in keys_to_delete:
                del _mem_cache[k]


def health():
    """Return cache status (for /api/health endpoint)."""
    if _use_redis():
        try:
            client = _init_redis()
            if client:
                client.ping()
                return {"backend": "redis", "status": "ok"}
        except Exception:
            pass
    return {"backend": "in-memory", "status": "ok"}


def stats():
    """Return cache stats (debug)."""
    if _use_redis():
        try:
            client = _init_redis()
            if client:
                info = client.info("memory")
                return {
                    "backend": "redis",
                    "used_memory": info.get("used_memory_human"),
                    "maxmemory": info.get("maxmemory_human", "unlimited"),
                    "connected_clients": info.get("connected_clients"),
                }
        except Exception:
            pass
    with _mem_lock:
        return {"backend": "in-memory", "entries": len(_mem_cache)}
