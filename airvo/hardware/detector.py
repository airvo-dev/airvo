"""
airvo/hardware/detector.py
──────────────────────────
Detects system RAM, GPU/VRAM, and currently loaded Ollama models.

Public API
──────────
    get_hardware_status()      → HardwareStatus
    get_ollama_loaded_models() → List[OllamaModel]
    is_psutil_available()      → bool
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List, Optional

logger = logging.getLogger(__name__)


# ── Availability check ───────────────────────────────────────────────────────

def is_psutil_available() -> bool:
    try:
        import psutil  # noqa: F401
        return True
    except ImportError:
        return False


# ── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class GpuInfo:
    name:       str
    vram_total_mb: float
    vram_used_mb:  float
    vram_free_mb:  float

    @property
    def vram_percent(self) -> float:
        if self.vram_total_mb == 0:
            return 0.0
        return round(self.vram_used_mb / self.vram_total_mb * 100, 1)


@dataclass
class OllamaModel:
    name:       str           # e.g. "llama3:latest"
    size_mb:    float         # model size on disk / in VRAM
    digest:     str = ""
    expires_at: str = ""      # ISO-8601 when Ollama will unload it


@dataclass
class HardwareStatus:
    # ── RAM ─────────────────────────────────────────────────────────────────
    ram_total_mb:  float = 0.0
    ram_used_mb:   float = 0.0
    ram_free_mb:   float = 0.0
    ram_percent:   float = 0.0

    # ── GPU / VRAM ───────────────────────────────────────────────────────────
    gpus: List[GpuInfo] = field(default_factory=list)

    # ── Ollama ───────────────────────────────────────────────────────────────
    ollama_running:       bool             = False
    ollama_loaded_models: List[OllamaModel] = field(default_factory=list)
    ollama_base_url:      str             = "http://localhost:11434"

    # ── Meta ─────────────────────────────────────────────────────────────────
    psutil_available: bool = False
    error:            str  = ""


# ── Internal helpers ─────────────────────────────────────────────────────────

def _ram_info() -> tuple[float, float, float, float]:
    """Returns (total_mb, used_mb, free_mb, percent)."""
    import psutil
    mem = psutil.virtual_memory()
    to_mb = lambda b: round(b / 1024 / 1024, 1)
    return (
        to_mb(mem.total),
        to_mb(mem.used),
        to_mb(mem.available),
        round(mem.percent, 1),
    )


def _gpu_info() -> List[GpuInfo]:
    """Try to detect GPU(s) via pynvml (NVIDIA) or skip gracefully."""
    gpus = []
    try:
        import pynvml
        pynvml.nvmlInit()
        count = pynvml.nvmlDeviceGetCount()
        for i in range(count):
            handle = pynvml.nvmlDeviceGetHandleByIndex(i)
            name   = pynvml.nvmlDeviceGetName(handle)
            if isinstance(name, bytes):
                name = name.decode()
            mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
            to_mb = lambda b: round(b / 1024 / 1024, 1)
            gpus.append(GpuInfo(
                name=name,
                vram_total_mb=to_mb(mem.total),
                vram_used_mb=to_mb(mem.used),
                vram_free_mb=to_mb(mem.free),
            ))
        pynvml.nvmlShutdown()
    except Exception:
        pass  # pynvml not installed or no NVIDIA GPU — that's fine
    return gpus


def _ollama_models(base_url: str) -> tuple[bool, List[OllamaModel]]:
    """
    Query Ollama /api/ps for currently loaded (in-memory) models.
    Returns (ollama_running, models).
    """
    import urllib.request
    import json

    url = f"{base_url.rstrip('/')}/api/ps"
    try:
        with urllib.request.urlopen(url, timeout=2) as resp:
            data = json.loads(resp.read())
        models = []
        for m in data.get("models", []):
            size_bytes = m.get("size", m.get("size_vram", 0))
            models.append(OllamaModel(
                name=m.get("name", m.get("model", "unknown")),
                size_mb=round(size_bytes / 1024 / 1024, 1),
                digest=m.get("digest", ""),
                expires_at=m.get("expires_at", ""),
            ))
        return True, models
    except Exception:
        return False, []


# ── Public functions ──────────────────────────────────────────────────────────

def get_hardware_status(ollama_base_url: str = "http://localhost:11434") -> HardwareStatus:
    """
    Collect RAM, GPU and Ollama info in one call.
    Never raises — errors are captured in HardwareStatus.error.
    """
    status = HardwareStatus(
        ollama_base_url=ollama_base_url,
        psutil_available=is_psutil_available(),
    )

    # ── RAM ──────────────────────────────────────────────────────────────────
    if status.psutil_available:
        try:
            t, u, f, p = _ram_info()
            status.ram_total_mb  = t
            status.ram_used_mb   = u
            status.ram_free_mb   = f
            status.ram_percent   = p
        except Exception as exc:
            status.error = f"RAM detection failed: {exc}"

    # ── GPU ──────────────────────────────────────────────────────────────────
    try:
        status.gpus = _gpu_info()
    except Exception:
        pass  # GPU info is best-effort

    # ── Ollama ───────────────────────────────────────────────────────────────
    try:
        running, models = _ollama_models(ollama_base_url)
        status.ollama_running       = running
        status.ollama_loaded_models = models
    except Exception as exc:
        logger.debug(f"[HW] Ollama check failed: {exc}")

    return status


def get_ollama_loaded_models(base_url: str = "http://localhost:11434") -> List[OllamaModel]:
    """Convenience wrapper — returns just the loaded Ollama models."""
    _, models = _ollama_models(base_url)
    return models
