"""
Prompt Cache — local hash-based cache for LLM responses.

Key: SHA-256 of (model_id + normalized messages JSON)
Value: cached response text + metadata

Features:
  - TTL configurable via prefs ("cache_ttl_seconds", default 3600)
  - Max entries configurable via prefs ("cache_max_entries", default 500)
  - Can be disabled via prefs ("cache_enabled", default True)
  - Only caches successful, non-empty responses
  - Persisted to ~/.airvo/prompt_cache.json
  - Thread-safe
  - 100% local — no network calls

Cache is intentionally NOT used for:
  - Tool calls (stateful, side-effect-prone)
  - Requests with temperature > 0.1 (non-deterministic by design)
"""

from __future__ import annotations

import hashlib
import json
import os
import time
from threading import Lock
from typing import Optional

_CACHE_FILE = os.path.join(os.path.expanduser("~"), ".airvo", "prompt_cache.json")
_lock = Lock()


# ── User-configurable settings (read from prefs at call time) ────────────

def _get_prefs() -> dict:
    try:
        from airvo.config.settings import settings as _s
        return _s.get_prefs()
    except Exception:
        return {}


def _cache_enabled() -> bool:
    return bool(_get_prefs().get("cache_enabled", True))


def _ttl() -> int:
    return int(_get_prefs().get("cache_ttl_seconds", 3600))


def _max_entries() -> int:
    return int(_get_prefs().get("cache_max_entries", 500))


# ── Persistence ──────────────────────────────────────────────────────────

def _load() -> dict:
    try:
        if os.path.exists(_CACHE_FILE):
            with open(_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save(data: dict) -> None:
    try:
        os.makedirs(os.path.dirname(_CACHE_FILE), exist_ok=True)
        with open(_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    except Exception:
        pass


# ── Cache key ─────────────────────────────────────────────────────────────

def make_key(model_id: str, messages: list) -> str:
    """
    Deterministic SHA-256 key from model + messages.
    Messages are normalized: role + content only, whitespace stripped.
    """
    normalized = [
        {"role": m.get("role", ""), "content": (m.get("content") or "").strip()}
        for m in messages
        if m.get("role") != "system"   # exclude system prompts — they change often
    ]
    payload = json.dumps({"model": model_id, "messages": normalized},
                         sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


# ── Public API ────────────────────────────────────────────────────────────

def get(model_id: str, messages: list) -> Optional[dict]:
    """
    Return cached entry if it exists and hasn't expired, else None.
    Entry has: response, tokens, cost_usd, cached_at, model_id
    """
    if not _cache_enabled():
        return None
    key = make_key(model_id, messages)
    with _lock:
        data = _load()
    entry = data.get(key)
    if not entry:
        return None
    age = time.time() - entry.get("cached_at", 0)
    if age > _ttl():
        return None   # expired (will be evicted on next put)
    entry["age_s"] = round(age, 1)
    entry["cache_hit"] = True
    return entry


def put(model_id: str, messages: list, response: str,
        tokens: int = 0, cost_usd: float = 0.0) -> str:
    """
    Store a response in cache. Returns the cache key.
    No-op if cache is disabled or response is empty.
    """
    if not _cache_enabled() or not response.strip():
        return ""
    key = make_key(model_id, messages)
    entry = {
        "model_id":  model_id,
        "response":  response,
        "tokens":    tokens,
        "cost_usd":  cost_usd,
        "cached_at": time.time(),
    }
    with _lock:
        data = _load()
        data[key] = entry
        # Evict oldest entries if over limit
        max_e = _max_entries()
        if len(data) > max_e:
            # Sort by cached_at, drop oldest
            sorted_keys = sorted(data, key=lambda k: data[k].get("cached_at", 0))
            for old_key in sorted_keys[:len(data) - max_e]:
                del data[old_key]
        _save(data)
    return key


def invalidate(model_id: str, messages: list) -> bool:
    """Remove a specific cache entry. Returns True if it existed."""
    key = make_key(model_id, messages)
    with _lock:
        data = _load()
        if key in data:
            del data[key]
            _save(data)
            return True
    return False


def clear(model_id: Optional[str] = None) -> int:
    """Clear all cache entries (or only for a specific model). Returns count deleted."""
    with _lock:
        data = _load()
        if model_id:
            before = len(data)
            data = {k: v for k, v in data.items() if v.get("model_id") != model_id}
            count = before - len(data)
        else:
            count = len(data)
            data = {}
        _save(data)
    return count


def stats() -> dict:
    """Return cache statistics."""
    with _lock:
        data = _load()
    now = time.time()
    ttl = _ttl()
    valid   = sum(1 for v in data.values() if now - v.get("cached_at", 0) <= ttl)
    expired = len(data) - valid
    total_tokens_saved = sum(
        v.get("tokens", 0) for v in data.values()
        if now - v.get("cached_at", 0) <= ttl
    )
    total_cost_saved = sum(
        v.get("cost_usd", 0.0) for v in data.values()
        if now - v.get("cached_at", 0) <= ttl
    )
    return {
        "total_entries":     len(data),
        "valid_entries":     valid,
        "expired_entries":   expired,
        "ttl_seconds":       ttl,
        "max_entries":       _max_entries(),
        "enabled":           _cache_enabled(),
        "tokens_saved":      total_tokens_saved,
        "cost_saved_usd":    round(total_cost_saved, 6),
    }
