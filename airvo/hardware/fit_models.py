"""
airvo/hardware/fit_models.py
────────────────────────────
Determines which Ollama models can run on this machine given current RAM/VRAM.
Uses the curated catalog from discoverer.py as the model database.
"""
from __future__ import annotations

from typing import List

from airvo.discovery.discoverer import OLLAMA_CATALOG, get_ollama_installed

# Safety margin: a model needs slightly more RAM than its file size
_RAM_MARGIN  = 1.15   # 15 % headroom for RAM
_VRAM_MARGIN = 1.10   # 10 % headroom for VRAM (GPU handles compression better)

# Fit status labels
FIT_PERFECT  = "fits"          # comfortably fits
FIT_TIGHT    = "tight"         # fits but <20 % free headroom after loading
FIT_NO       = "too_large"     # does not fit


def _fit_status(model_gb: float, available_gb: float) -> str:
    needed = model_gb * _RAM_MARGIN
    if needed > available_gb:
        return FIT_NO
    # "tight" if loading would leave less than 20 % of available RAM free
    remaining = available_gb - needed
    if remaining / available_gb < 0.20:
        return FIT_TIGHT
    return FIT_PERFECT


def get_fit_models(
    ram_free_mb: float,
    vram_free_mb: float = 0.0,
    ollama_base_url: str = "http://localhost:11434",
) -> dict:
    """
    Return all catalog models annotated with whether they fit in RAM and/or VRAM.

    Args:
        ram_free_mb:      Available system RAM in MB (from hardware detector).
        vram_free_mb:     Available VRAM in MB (0 if no GPU or no pynvml).
        ollama_base_url:  Ollama API base URL to check which models are installed.

    Returns dict with keys:
        "models"      list of model dicts with fit metadata
        "summary"     counts per fit category
        "hardware"    echo of input RAM/VRAM values in GB
    """
    ram_free_gb  = ram_free_mb  / 1024
    vram_free_gb = vram_free_mb / 1024
    has_gpu      = vram_free_gb > 0.5  # ignore tiny VRAM reports

    installed_names = set(get_ollama_installed(ollama_base_url))

    models: list[dict] = []
    for m in OLLAMA_CATALOG:
        size_gb = m["size_gb"]

        ram_fit  = _fit_status(size_gb, ram_free_gb)
        gpu_fit  = _fit_status(size_gb, vram_free_gb) if has_gpu else None

        # Best available fit: GPU preferred when it fits
        best_fit: str
        if gpu_fit in (FIT_PERFECT, FIT_TIGHT):
            best_fit = gpu_fit
            runs_on  = "gpu"
        elif ram_fit in (FIT_PERFECT, FIT_TIGHT):
            best_fit = ram_fit
            runs_on  = "cpu"
        else:
            best_fit = FIT_NO
            runs_on  = None

        is_installed = any(
            m["id"].lower() == n.lower() or m["id"].split(":")[0] == n.split(":")[0]
            for n in installed_names
        )

        models.append({
            "id":           m["id"],
            "name":         m["name"],
            "size_gb":      size_gb,
            "tags":         m.get("tags", []),
            "fit":          best_fit,          # "fits" | "tight" | "too_large"
            "runs_on":      runs_on,           # "gpu" | "cpu" | null
            "ram_fit":      ram_fit,
            "gpu_fit":      gpu_fit,
            "installed":    is_installed,
            "ollama_pull":  f"ollama pull {m['id']}",
        })

    # Sort: fits first, then tight, then too_large; installed models first within group
    order = {FIT_PERFECT: 0, FIT_TIGHT: 1, FIT_NO: 2}
    models.sort(key=lambda x: (order[x["fit"]], not x["installed"], x["size_gb"]))

    counts = {
        "fits":      sum(1 for m in models if m["fit"] == FIT_PERFECT),
        "tight":     sum(1 for m in models if m["fit"] == FIT_TIGHT),
        "too_large": sum(1 for m in models if m["fit"] == FIT_NO),
        "installed": sum(1 for m in models if m["installed"]),
    }

    return {
        "models": models,
        "summary": counts,
        "hardware": {
            "ram_free_gb":  round(ram_free_gb, 1),
            "vram_free_gb": round(vram_free_gb, 1) if has_gpu else 0,
            "has_gpu":      has_gpu,
        },
    }
