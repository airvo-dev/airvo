"""
Cost Consciousness - per-token pricing for Airvo.

Primary source: LiteLLM built-in model_cost map (2700+ models).
Fallback: hardcoded table for unknown models.
All costs in USD. 100% local.
"""

from __future__ import annotations

import json
import os
from threading import Lock

try:
    import litellm as _litellm
    _LITELLM_COST_MAP: dict = getattr(_litellm, "model_cost", {})
except Exception:
    _litellm = None
    _LITELLM_COST_MAP = {}

_FALLBACK_PRICING: dict[str, dict[str, float]] = {
    "groq/":       {"input": 0.0,   "output": 0.0},
    "ollama/":     {"input": 0.0,   "output": 0.0},
    "lmstudio/":   {"input": 0.0,   "output": 0.0},
    "cerebras/":   {"input": 0.0,   "output": 0.0},
    "openai/":     {"input": 2.50,  "output": 10.00},
    "anthropic/":  {"input": 3.00,  "output": 15.00},
    "google/":     {"input": 1.25,  "output": 5.00},
    "mistral/":    {"input": 0.40,  "output": 1.20},
    "together/":   {"input": 0.10,  "output": 0.10},
    "openrouter/": {"input": 0.50,  "output": 1.50},
    "cohere/":     {"input": 0.15,  "output": 0.60},
    "_default":    {"input": 1.00,  "output": 3.00},
}


def _strip_provider(model_id: str) -> str:
    if "/" in model_id:
        return model_id.split("/", 1)[1]
    return model_id


def get_pricing_per_token(model_id: str) -> dict[str, float]:
    model_lower = (model_id or "").lower()
    entry = _LITELLM_COST_MAP.get(model_lower)
    if entry is None:
        bare = _strip_provider(model_lower)
        entry = _LITELLM_COST_MAP.get(bare)
    if entry:
        return {
            "input":  entry.get("input_cost_per_token", 0.0),
            "output": entry.get("output_cost_per_token", 0.0),
            "source": "litellm",
        }
    best_key = "_default"
    best_len = 0
    for key in _FALLBACK_PRICING:
        if key == "_default":
            continue
        if model_lower.startswith(key) and len(key) > best_len:
            best_key = key
            best_len = len(key)
    fb = _FALLBACK_PRICING[best_key]
    return {
        "input":  fb["input"]  / 1_000_000,
        "output": fb["output"] / 1_000_000,
        "source": "fallback",
    }


def estimate_cost(model_id: str, input_tokens: int, output_tokens: int) -> float:
    pricing = get_pricing_per_token(model_id)
    return round(input_tokens * pricing["input"] + output_tokens * pricing["output"], 8)


def estimate_cost_from_total(model_id: str, total_tokens: int) -> float:
    input_t  = int(total_tokens * 0.4)
    output_t = total_tokens - input_t
    return estimate_cost(model_id, input_t, output_t)


def estimate_cost_from_response(model_id: str, response) -> float:
    if _litellm is not None:
        try:
            cost = _litellm.completion_cost(completion_response=response)
            if cost and cost > 0:
                return round(cost, 8)
        except Exception:
            pass
    try:
        usage = response.usage
        if usage:
            return estimate_cost(model_id, usage.prompt_tokens or 0, usage.completion_tokens or 0)
    except Exception:
        pass
    return 0.0


def format_cost(cost_usd: float) -> str:
    if cost_usd == 0.0:
        return "free"
    if cost_usd < 0.0001:
        return f"${cost_usd * 1_000_000:.2f}u"
    if cost_usd < 0.01:
        return f"${cost_usd * 1000:.3f}m"
    return f"${cost_usd:.4f}"


_COST_FILE = os.path.join(os.path.expanduser("~"), ".airvo", "cost_tracker.json")
_cost_lock = Lock()


def _load_cost_data() -> dict:
    try:
        if os.path.exists(_COST_FILE):
            with open(_COST_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {"monthly": {}, "total_usd": 0.0}


def _save_cost_data(data: dict) -> None:
    try:
        os.makedirs(os.path.dirname(_COST_FILE), exist_ok=True)
        with open(_COST_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception:
        pass


def record_cost(model_id: str, cost_usd: float) -> None:
    if cost_usd <= 0:
        return
    from datetime import date
    month_key = date.today().strftime("%Y-%m")
    with _cost_lock:
        data = _load_cost_data()
        data["total_usd"] = round(data.get("total_usd", 0.0) + cost_usd, 8)
        monthly = data.setdefault("monthly", {})
        by_model = monthly.setdefault(month_key, {})
        by_model[model_id] = round(by_model.get(model_id, 0.0) + cost_usd, 8)
        _save_cost_data(data)


def get_monthly_cost(month_key=None) -> dict:
    from datetime import date
    if month_key is None:
        month_key = date.today().strftime("%Y-%m")
    data = _load_cost_data()
    return data.get("monthly", {}).get(month_key, {})


def get_total_cost() -> float:
    return _load_cost_data().get("total_usd", 0.0)


def get_savings_vs_gpt4o(model_id: str, total_tokens: int) -> float:
    gpt4o_cost = estimate_cost_from_total("openai/gpt-4o", total_tokens)
    actual_cost = estimate_cost_from_total(model_id, total_tokens)
    return round(max(0.0, gpt4o_cost - actual_cost), 8)
