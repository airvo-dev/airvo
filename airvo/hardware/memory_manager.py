"""
airvo/hardware/memory_manager.py
─────────────────────────────────
Smart model rotation — analyses available RAM vs loaded Ollama models
and produces actionable suggestions (load / unload / warning).

Public API
──────────
    get_suggestions(status)           → List[ModelSuggestion]
    unload_ollama_model(name, url)    → bool
    get_memory_pressure()             → MemoryPressure  ("ok"|"warning"|"critical")
"""

from __future__ import annotations

import logging
import urllib.request
import json
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional

from airvo.hardware.detector import HardwareStatus, OllamaModel

logger = logging.getLogger(__name__)

# ── Thresholds ────────────────────────────────────────────────────────────────
RAM_WARNING_PCT  = 75.0   # show yellow warning above this
RAM_CRITICAL_PCT = 90.0   # show red + suggest unloading above this


# ── Types ─────────────────────────────────────────────────────────────────────

class MemoryPressure(str, Enum):
    OK       = "ok"
    WARNING  = "warning"
    CRITICAL = "critical"


@dataclass
class ModelSuggestion:
    action:  str          # "unload" | "warning" | "info"
    model:   str          # model name (Ollama) or Airvo model ID
    reason:  str          # human-readable explanation
    size_mb: float = 0.0  # RAM freed if unloaded


# ── Public functions ──────────────────────────────────────────────────────────

def get_memory_pressure(status: HardwareStatus) -> MemoryPressure:
    """Classify current RAM pressure level."""
    if not status.psutil_available or status.ram_total_mb == 0:
        return MemoryPressure.OK
    if status.ram_percent >= RAM_CRITICAL_PCT:
        return MemoryPressure.CRITICAL
    if status.ram_percent >= RAM_WARNING_PCT:
        return MemoryPressure.WARNING
    return MemoryPressure.OK


def get_suggestions(status: HardwareStatus) -> List[ModelSuggestion]:
    """
    Analyse the hardware status and return a prioritised list of suggestions.

    Rules:
    - If RAM > 90% and Ollama models are loaded → suggest unloading the largest ones
    - If RAM > 75% → warn that resources are constrained
    - If Ollama is running and models loaded but RAM is fine → info message
    - If RAM is fine and nothing loaded → no suggestions
    """
    suggestions: List[ModelSuggestion] = []
    pressure = get_memory_pressure(status)

    if pressure == MemoryPressure.CRITICAL:
        # Suggest unloading Ollama models, largest first
        loaded = sorted(
            status.ollama_loaded_models,
            key=lambda m: m.size_mb,
            reverse=True,
        )
        for m in loaded:
            suggestions.append(ModelSuggestion(
                action="unload",
                model=m.name,
                reason=(
                    f"RAM is at {status.ram_percent:.0f}% — unloading '{m.name}' "
                    f"would free ~{m.size_mb:.0f} MB."
                ),
                size_mb=m.size_mb,
            ))
        if not loaded:
            suggestions.append(ModelSuggestion(
                action="warning",
                model="system",
                reason=(
                    f"RAM is critically high ({status.ram_percent:.0f}%). "
                    "Close other applications to free memory."
                ),
            ))

    elif pressure == MemoryPressure.WARNING:
        suggestions.append(ModelSuggestion(
            action="warning",
            model="system",
            reason=(
                f"RAM usage is at {status.ram_percent:.0f}% "
                f"({status.ram_used_mb:.0f} MB / {status.ram_total_mb:.0f} MB). "
                "Consider unloading unused models."
            ),
        ))

    elif status.ollama_running and status.ollama_loaded_models:
        # Healthy RAM but models are loaded — just inform
        names = ", ".join(m.name for m in status.ollama_loaded_models)
        total_mb = sum(m.size_mb for m in status.ollama_loaded_models)
        suggestions.append(ModelSuggestion(
            action="info",
            model="ollama",
            reason=(
                f"Ollama has {len(status.ollama_loaded_models)} model(s) loaded "
                f"in memory ({total_mb:.0f} MB): {names}."
            ),
            size_mb=total_mb,
        ))

    return suggestions


def unload_ollama_model(
    model_name: str,
    base_url: str = "http://localhost:11434",
) -> bool:
    """
    Ask Ollama to unload a model from memory by sending it a generate request
    with keep_alive=0, which forces immediate unloading.

    Returns True on success, False on any error.
    """
    url = f"{base_url.rstrip('/')}/api/generate"
    payload = json.dumps({
        "model":      model_name,
        "keep_alive": 0,
    }).encode()

    try:
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5):
            pass
        logger.info(f"[HW] Unloaded Ollama model: {model_name}")
        return True
    except Exception as exc:
        logger.warning(f"[HW] Failed to unload '{model_name}': {exc}")
        return False
