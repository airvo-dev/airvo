"""
airvo/ratings/store.py
======================
Persists 👍/👎 response quality ratings to ~/.airvo/ratings.json.

Schema per entry:
  {
    "id":           "<uuid>",
    "model_id":     "groq/llama-3.3-70b-versatile",
    "model_name":   "Llama 3.3 70B (Groq)",
    "prompt":       "<first 200 chars of user prompt>",
    "rating":       "up" | "down",
    "timestamp":    1716000000.0,
    "route_category": "code" | "debug" | ... | null
  }

Smart Router reads get_model_scores() after MIN_RATINGS_FOR_BOOST ratings.
"""

from __future__ import annotations

import json
import os
import time
import uuid
from typing import Literal

_RATINGS_FILE = os.path.join(os.path.expanduser("~"), ".airvo", "ratings.json")
_MAX_ENTRIES  = 2000       # cap to avoid unbounded growth
MIN_RATINGS_FOR_BOOST = 50  # minimum ratings before Smart Router trusts the data


# ── Persistence ───────────────────────────────────────────────────────────

def _load() -> list[dict]:
    try:
        if os.path.exists(_RATINGS_FILE):
            with open(_RATINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
    except Exception:
        pass
    return []


def _save(entries: list[dict]) -> None:
    try:
        os.makedirs(os.path.dirname(_RATINGS_FILE), exist_ok=True)
        with open(_RATINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


# ── Public API ────────────────────────────────────────────────────────────

def add_rating(
    model_id: str,
    model_name: str,
    prompt: str,
    rating: Literal["up", "down"],
    route_category: str | None = None,
) -> dict:
    """Save a new rating and return the saved entry."""
    entries = _load()
    entry = {
        "id":             str(uuid.uuid4()),
        "model_id":       model_id,
        "model_name":     model_name,
        "prompt":         prompt[:200],
        "rating":         rating,
        "timestamp":      time.time(),
        "route_category": route_category,
    }
    entries.append(entry)
    # keep only the most recent _MAX_ENTRIES
    if len(entries) > _MAX_ENTRIES:
        entries = entries[-_MAX_ENTRIES:]
    _save(entries)
    return entry


def get_all() -> list[dict]:
    """Return all stored ratings, newest first."""
    return list(reversed(_load()))


def get_stats() -> dict:
    """
    Return per-model rating stats and whether the Smart Router
    has enough data to use them.

    Returns:
      {
        "total": int,
        "ready": bool,          # True when total >= MIN_RATINGS_FOR_BOOST
        "models": {
          "<model_id>": {
            "name":    str,
            "up":      int,
            "down":    int,
            "total":   int,
            "score":   float    # 0.0 – 1.0  (up / total)
          }
        }
      }
    """
    entries = _load()
    total   = len(entries)
    models: dict[str, dict] = {}

    for e in entries:
        mid  = e.get("model_id", "unknown")
        if mid not in models:
            models[mid] = {
                "name":  e.get("model_name", mid),
                "up":    0,
                "down":  0,
                "total": 0,
                "score": 0.5,
            }
        models[mid]["total"] += 1
        if e.get("rating") == "up":
            models[mid]["up"] += 1
        else:
            models[mid]["down"] += 1

    for m in models.values():
        m["score"] = round(m["up"] / m["total"], 3) if m["total"] > 0 else 0.5

    return {
        "total":  total,
        "ready":  total >= MIN_RATINGS_FOR_BOOST,
        "models": models,
    }


def get_model_scores() -> dict[str, float]:
    """
    Convenience function for the Smart Router.
    Returns {model_id: score} only when ready (>= MIN_RATINGS_FOR_BOOST).
    Returns empty dict otherwise.
    """
    stats = get_stats()
    if not stats["ready"]:
        return {}
    return {mid: data["score"] for mid, data in stats["models"].items()}
