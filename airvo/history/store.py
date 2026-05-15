"""
Request History Store — persists every chat request to ~/.airvo/request_history.json.

Each entry contains:
  - id          : unique string (timestamp-based)
  - timestamp   : unix float
  - prompt      : last user message (full text, no truncation)
  - messages    : full conversation snapshot (for replay)
  - model_id    : model used (first/primary for multi-model)
  - mode        : single | parallel | race | vote | review
  - response    : assistant response text
  - tokens      : total tokens used
  - cost_usd    : actual cost
  - elapsed_s   : response time
  - replays     : list of counterfactual replay results

Max 500 entries. FIFO eviction. Thread-safe. 100% local.
"""

from __future__ import annotations

import json
import os
import time
from threading import Lock
from typing import Optional

_HISTORY_FILE = os.path.join(os.path.expanduser("~"), ".airvo", "request_history.json")
_lock         = Lock()


def _max_entries() -> int:
    """Read user-configured limit from prefs. Falls back to 200."""
    try:
        from airvo.config.settings import settings as _s
        return int(_s.get_prefs().get("history_max_entries", 200))
    except Exception:
        return 200


def _history_enabled() -> bool:
    try:
        from airvo.config.settings import settings as _s
        return bool(_s.get_prefs().get("history_enabled", True))
    except Exception:
        return True


def _load() -> list:
    try:
        if os.path.exists(_HISTORY_FILE):
            with open(_HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return []


def _save(entries: list) -> None:
    try:
        os.makedirs(os.path.dirname(_HISTORY_FILE), exist_ok=True)
        with open(_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def record(
    *,
    messages:   list,
    model_id:   str,
    mode:       str,
    response:   str,
    tokens:     int   = 0,
    cost_usd:   float = 0.0,
    elapsed_s:  float = 0.0,
) -> str:
    """
    Persist a completed request. Returns the assigned entry id.
    Returns empty string if history is disabled.
    """
    if not _history_enabled():
        return ""
    entry_id = f"{time.time():.6f}"
    # Extract last user message for quick display
    prompt = next(
        (m["content"] for m in reversed(messages)
         if m.get("role") == "user" and isinstance(m.get("content"), str)),
        "",
    )
    entry = {
        "id":        entry_id,
        "timestamp": time.time(),
        "prompt":    prompt,
        "messages":  messages,   # full snapshot for replay
        "model_id":  model_id,
        "mode":      mode,
        "response":  response,
        "tokens":    tokens,
        "cost_usd":  cost_usd,
        "elapsed_s": elapsed_s,
        "replays":   [],
    }
    with _lock:
        entries = _load()
        entries.insert(0, entry)          # newest first
        max_e = _max_entries()
        if len(entries) > max_e:
            entries = entries[:max_e]
        _save(entries)
    return entry_id


def record_replay(
    entry_id:  str,
    model_id:  str,
    response:  str,
    tokens:    int   = 0,
    cost_usd:  float = 0.0,
    elapsed_s: float = 0.0,
) -> bool:
    """Append a counterfactual replay result to an existing entry. Returns True on success."""
    with _lock:
        entries = _load()
        for e in entries:
            if e["id"] == entry_id:
                e.setdefault("replays", []).append({
                    "model_id":  model_id,
                    "response":  response,
                    "tokens":    tokens,
                    "cost_usd":  cost_usd,
                    "elapsed_s": elapsed_s,
                    "timestamp": time.time(),
                })
                _save(entries)
                return True
    return False


def get_entry(entry_id: str) -> Optional[dict]:
    entries = _load()
    return next((e for e in entries if e["id"] == entry_id), None)


def list_entries(
    limit:  int = 50,
    offset: int = 0,
    search: str = "",
) -> dict:
    entries = _load()
    if search:
        q = search.lower()
        entries = [e for e in entries if q in e.get("prompt", "").lower()
                   or q in e.get("model_id", "").lower()]
    total = len(entries)
    page  = entries[offset: offset + limit]
    # Return summary (no messages blob for list view — keeps payload small)
    return {
        "total":   total,
        "offset":  offset,
        "limit":   limit,
        "entries": [
            {
                "id":        e["id"],
                "timestamp": e["timestamp"],
                "prompt":    e["prompt"][:200],
                "model_id":  e["model_id"],
                "mode":      e["mode"],
                "tokens":    e["tokens"],
                "cost_usd":  e["cost_usd"],
                "elapsed_s": e["elapsed_s"],
                "replay_count": len(e.get("replays", [])),
            }
            for e in page
        ],
    }


def clear_history() -> int:
    """Delete all entries. Returns count deleted."""
    with _lock:
        entries = _load()
        count = len(entries)
        _save([])
    return count
