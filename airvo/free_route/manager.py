"""
airvo/free_route/manager.py
===========================
Free Route: discover the best free models on OpenRouter, ranked by
category (code, debug, math, creative, explain, general) using their
published benchmark scores.

State file: ~/.airvo/free_route.json
{
  "enabled": true,
  "api_key": "sk-or-v1-...",
  "last_refresh": 1723200000.0,
  "models_by_category": {
    "code":    [{"id": "openrouter/poolside/laguna-s-2.1:free", "name": "...", "score": 70.2}, ...],
    "debug":   [...],
    "math":    [...],
    "creative":[...],
    "explain": [...],
    "general": [...]
  },
  "active_model_ids": ["openrouter/poolside/laguna-s-2.1:free", ...]
}
"""

from __future__ import annotations

import json
import os
import time
from typing import Any

import httpx

_STATE_FILE = os.path.join(os.path.expanduser("~"), ".airvo", "free_route.json")
_OR_MODELS_URL = "https://openrouter.ai/api/v1/models"
_MAX_PER_CATEGORY = 3   # top N free models per category stored
_MAX_ACTIVE       = 5   # cap at the Airvo MAX_ACTIVE limit

# ── Category → benchmark field used for ranking ──────────────────────────────
_CATEGORY_SCORE: dict[str, str] = {
    "code":     "coding_index",
    "debug":    "coding_index",
    "math":     "intelligence_index",
    "creative": "intelligence_index",
    "explain":  "intelligence_index",
    "general":  "agentic_index",
}

CATEGORIES = list(_CATEGORY_SCORE.keys())


# ── State I/O ─────────────────────────────────────────────────────────────────

def _load() -> dict:
    try:
        if os.path.exists(_STATE_FILE):
            with open(_STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {"enabled": False}


def _save(state: dict) -> None:
    try:
        os.makedirs(os.path.dirname(_STATE_FILE), exist_ok=True)
        with open(_STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


# ── OpenRouter helpers ────────────────────────────────────────────────────────

def _fetch_free_models(api_key: str) -> list[dict]:
    """Fetch all free models from OpenRouter and return enriched dicts."""
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        r = httpx.get(_OR_MODELS_URL, headers=headers, timeout=20.0)
        r.raise_for_status()
        models = r.json().get("data", [])
    except Exception as e:
        raise RuntimeError(f"Failed to fetch OpenRouter models: {e}") from e

    free: list[dict] = []
    for m in models:
        pricing = m.get("pricing", {})
        prompt_price = pricing.get("prompt", "-1")
        # Free models have prompt == "0"
        if str(prompt_price) != "0":
            continue
        # Skip router/alias models
        mid = m.get("id", "")
        if mid.startswith("openrouter/auto") or mid.startswith("~"):
            continue
        # Extract benchmark scores
        benchmarks = m.get("benchmarks") or {}
        aa = benchmarks.get("artificial_analysis") or {}
        free.append({
            "id":                f"openrouter/{mid}",
            "name":              m.get("name", mid),
            "description":       m.get("description", "")[:200],
            "coding_index":      aa.get("coding_index") or 0.0,
            "intelligence_index": aa.get("intelligence_index") or 0.0,
            "agentic_index":     aa.get("agentic_index") or 0.0,
            "context_length":    m.get("context_length", 0),
        })

    return free


def _rank_by_category(free_models: list[dict]) -> dict[str, list[dict]]:
    """Return top-N free models per category, ranked by the relevant score."""
    result: dict[str, list[dict]] = {}
    seen_ids: set[str] = set()  # avoid adding the same model N times
    all_selected: list[str] = []

    for cat, score_field in _CATEGORY_SCORE.items():
        ranked = sorted(
            [m for m in free_models if m[score_field] > 0],
            key=lambda m: m[score_field],
            reverse=True,
        )[:_MAX_PER_CATEGORY]
        result[cat] = ranked
        for m in ranked:
            if m["id"] not in seen_ids:
                seen_ids.add(m["id"])
                all_selected.append(m["id"])

    return result


def _top_active_ids(models_by_category: dict[str, list[dict]]) -> list[str]:
    """Pick up to MAX_ACTIVE unique model IDs from the category rankings."""
    seen: set[str] = set()
    ids: list[str] = []
    # Interleave categories so we get diversity
    rows = list(zip(*[v for v in models_by_category.values() if v]))
    for row in rows:
        for m in row:
            if m["id"] not in seen:
                seen.add(m["id"])
                ids.append(m["id"])
                if len(ids) >= _MAX_ACTIVE:
                    return ids
    # Fill from remaining if needed
    for cat_models in models_by_category.values():
        for m in cat_models:
            if m["id"] not in seen:
                seen.add(m["id"])
                ids.append(m["id"])
                if len(ids) >= _MAX_ACTIVE:
                    return ids
    return ids


# ── Public API ────────────────────────────────────────────────────────────────

def setup(api_key: str) -> dict:
    """
    Fetch free models, rank them, store state.
    Returns the new state dict (without the api_key in plain text for response).
    """
    free_models = _fetch_free_models(api_key)
    if not free_models:
        raise ValueError("No free models found on OpenRouter. Check your API key.")

    models_by_category = _rank_by_category(free_models)
    active_ids = _top_active_ids(models_by_category)

    state = {
        "enabled":             True,
        "api_key":             api_key,
        "last_refresh":        time.time(),
        "models_by_category":  models_by_category,
        "active_model_ids":    active_ids,
        "total_free_found":    len(free_models),
    }
    _save(state)
    return state


def refresh() -> dict:
    """Re-fetch models using the stored API key. Raises if not configured."""
    state = _load()
    if not state.get("enabled") or not state.get("api_key"):
        raise RuntimeError("Free Route is not configured. Run setup first.")
    return setup(state["api_key"])


def get_status() -> dict:
    """Return current state (api_key masked)."""
    state = _load()
    if not state.get("enabled"):
        return {"enabled": False}
    masked = state.copy()
    key = masked.get("api_key", "")
    masked["api_key"] = key[:8] + "••••••••" + key[-4:] if len(key) > 12 else "••••••••"
    return masked


def disable() -> None:
    """Clear Free Route state."""
    _save({"enabled": False})


def get_active_model_ids() -> list[str]:
    """Return list of active free model IDs, or empty list if not enabled."""
    state = _load()
    if not state.get("enabled"):
        return []
    return state.get("active_model_ids", [])


def get_best_for_category(category: str) -> str | None:
    """
    Return the best free model ID for the given Smart Router category,
    or None if Free Route is disabled.
    """
    state = _load()
    if not state.get("enabled"):
        return None
    models_by_cat = state.get("models_by_category", {})
    cat_models = models_by_cat.get(category, [])
    if not cat_models:
        # fallback to general
        cat_models = models_by_cat.get("general", [])
    return cat_models[0]["id"] if cat_models else None


def test_api_key(api_key: str) -> bool:
    """Quick validation: can we fetch the OpenRouter model list?"""
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        r = httpx.get(_OR_MODELS_URL, headers=headers, timeout=10.0, params={"limit": 1})
        return r.status_code == 200
    except Exception:
        return False
