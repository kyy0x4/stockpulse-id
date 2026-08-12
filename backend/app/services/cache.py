import threading
import time

_cache = {}
_lock = threading.Lock()


def get(key):
    with _lock:
        entry = _cache.get(key)
        if entry and entry["expires"] > time.time():
            return entry["value"]
        return None


def set(key, value, ttl=900):
    with _lock:
        _cache[key] = {"value": value, "expires": time.time() + ttl}


def invalidate():
    with _lock:
        _cache.clear()