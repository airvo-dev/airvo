"""
airvo.discovery.discoverer
~~~~~~~~~~~~~~~~~~~~~~~~~~
Discover locally-installable Ollama models and remote OpenRouter models.
No extra dependencies — uses only urllib from stdlib.
"""
from __future__ import annotations

import json
import time
import logging
import urllib.request
from typing import List, Optional

logger = logging.getLogger(__name__)

# ── Curated Ollama Catalog ────────────────────────────────────────────────────
# Each entry: id, name, size_gb (typical), tags
OLLAMA_CATALOG: List[dict] = [
    # ── Tiny  (< 2 GB) — fit in almost any machine ──────────────────────
    {"id": "llama3.2:1b",           "name": "Llama 3.2 1B",            "size_gb": 0.8,  "tags": ["fast", "tiny"]},
    {"id": "qwen2.5:0.5b",          "name": "Qwen 2.5 0.5B",           "size_gb": 0.4,  "tags": ["tiny", "multilingual"]},
    {"id": "nomic-embed-text",       "name": "Nomic Embed Text",         "size_gb": 0.3,  "tags": ["embedding"]},
    # ── Small (2–5 GB) — good for 8 GB machines ─────────────────────────
    {"id": "llama3.2:3b",           "name": "Llama 3.2 3B",            "size_gb": 2.0,  "tags": ["fast", "recommended"]},
    {"id": "phi4-mini:3.8b",        "name": "Phi-4 Mini 3.8B",         "size_gb": 2.5,  "tags": ["microsoft", "reasoning"]},
    {"id": "gemma3:4b",             "name": "Gemma 3 4B",              "size_gb": 3.3,  "tags": ["google", "balanced"]},
    {"id": "qwen2.5:3b",            "name": "Qwen 2.5 3B",             "size_gb": 2.0,  "tags": ["multilingual"]},
    {"id": "codellama:7b",          "name": "Code Llama 7B",           "size_gb": 3.8,  "tags": ["coding"]},
    {"id": "mistral:7b",            "name": "Mistral 7B",              "size_gb": 4.1,  "tags": ["balanced", "recommended"]},
    {"id": "llama3.1:8b",           "name": "Llama 3.1 8B",            "size_gb": 4.7,  "tags": ["balanced", "recommended"]},
    {"id": "qwen2.5:7b",            "name": "Qwen 2.5 7B",             "size_gb": 4.4,  "tags": ["multilingual"]},
    {"id": "qwen2.5-coder:7b",      "name": "Qwen 2.5 Coder 7B",       "size_gb": 4.7,  "tags": ["coding", "recommended"]},
    # ── Medium (5–12 GB) — need 16 GB machines ──────────────────────────
    {"id": "deepseek-r1:7b",        "name": "DeepSeek R1 7B",          "size_gb": 4.7,  "tags": ["reasoning"]},
    {"id": "gemma3:12b",            "name": "Gemma 3 12B",             "size_gb": 8.1,  "tags": ["google", "balanced"]},
    {"id": "phi4:14b",              "name": "Phi-4 14B",               "size_gb": 8.0,  "tags": ["microsoft", "reasoning"]},
    {"id": "deepseek-r1:14b",       "name": "DeepSeek R1 14B",         "size_gb": 8.1,  "tags": ["reasoning"]},
    {"id": "qwen2.5:14b",           "name": "Qwen 2.5 14B",            "size_gb": 9.0,  "tags": ["multilingual"]},
    {"id": "deepseek-coder-v2:16b", "name": "DeepSeek Coder V2 16B",   "size_gb": 8.9,  "tags": ["coding"]},
    {"id": "mistral-small3.1:24b",  "name": "Mistral Small 3.1 24B",   "size_gb": 15.0, "tags": ["balanced"]},
    # ── Large (> 12 GB) — 32+ GB machines ──────────────────────────────
    {"id": "llama3.1:70b",          "name": "Llama 3.1 70B",           "size_gb": 40.0, "tags": ["large"]},
    {"id": "qwen2.5:72b",           "name": "Qwen 2.5 72B",            "size_gb": 43.0, "tags": ["multilingual", "large"]},
    {"id": "deepseek-r1:70b",       "name": "DeepSeek R1 70B",         "size_gb": 43.0, "tags": ["reasoning", "large"]},
]

# ── Simple in-process cache for OpenRouter (TTL 5 min) ───────────────────────
_or_cache: dict = {"ts": 0.0, "data": None}
_CACHE_TTL = 300  # seconds


def get_ollama_installed(base_url: str = "http://localhost:11434") -> List[str]:
    """Return list of model names already pulled locally via Ollama /api/tags."""
    try:
        with urllib.request.urlopen(f"{base_url}/api/tags", timeout=2) as r:
            data = json.loads(r.read())
        return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []


def get_ollama_discovery(
    base_url: str = "http://localhost:11434",
    ram_free_mb: Optional[float] = None,
) -> dict:
    """
    Return enriched catalog entries with `installed` and `fits_ram` fields.
    `ram_free_mb` is optional — if None, `fits_ram` is always True.
    """
    installed_raw = get_ollama_installed(base_url)
    # Normalise installed names: "llama3.2:3b" == "llama3.2:3b"
    installed_set = {n.lower() for n in installed_raw}

    entries = []
    for m in OLLAMA_CATALOG:
        mid = m["id"].lower()
        is_installed = any(
            mid == i or mid.split(":")[0] == i.split(":")[0]
            for i in installed_set
        )
        size_mb = m["size_gb"] * 1024
        fits    = (ram_free_mb is None) or (size_mb <= ram_free_mb * 0.90)
        entries.append({
            **m,
            "size_mb":   round(size_mb),
            "installed": is_installed,
            "fits_ram":  fits,
        })
    return {
        "catalog":   entries,
        "installed": installed_raw,
        "ollama_running": len(installed_raw) >= 0,  # True even if 0 models
    }


def get_openrouter_models(limit: int = 60) -> List[dict]:
    """
    Fetch available models from OpenRouter public API.
    Cached for 5 minutes to avoid hammering the endpoint.
    Returns a flat list sorted by name.
    """
    global _or_cache
    now = time.time()
    if _or_cache["data"] is not None and (now - _or_cache["ts"]) < _CACHE_TTL:
        return _or_cache["data"]

    try:
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/models",
            headers={"User-Agent": "Airvo/0.3.0", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            raw = json.loads(r.read())
        models_raw = raw.get("data", [])
    except Exception as exc:
        logger.warning("OpenRouter fetch failed: %s", exc)
        return []

    results = []
    for m in models_raw:
        pricing    = m.get("pricing", {})
        prompt_raw = pricing.get("prompt", "0")
        try:
            prompt_cost = float(prompt_raw)
        except (TypeError, ValueError):
            prompt_cost = 0.0

        is_free = prompt_cost == 0.0 or ":free" in m.get("id", "")
        ctx     = m.get("context_length", 0)

        results.append({
            "id":             m.get("id", ""),
            "name":           m.get("name") or m.get("id", ""),
            "description":    (m.get("description") or "")[:200],
            "context_length": ctx,
            "is_free":        is_free,
            "prompt_cost":    prompt_cost,
            "provider":       "openrouter",
        })

    # Sort: free first, then by name
    results.sort(key=lambda x: (0 if x["is_free"] else 1, x["name"].lower()))
    results = results[:limit]

    _or_cache = {"ts": now, "data": results}
    return results
