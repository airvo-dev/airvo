from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from airvo.config.settings import settings

router = APIRouter()


@router.get("/api/hardware/status", tags=["Hardware"], summary="Hardware status",
    description="Returns RAM usage, GPU/VRAM info, loaded Ollama models, memory pressure level, and smart suggestions. Works without psutil (returns partial data). Install with: `pip install airvo[hardware]`.")
async def hardware_status():
    try:
        from airvo.hardware.detector import get_hardware_status
        from airvo.hardware.memory_manager import get_memory_pressure, get_suggestions

        ollama_url = next(
            (m.get("base_url", "http://localhost:11434")
             for m in settings.get_models()
             if m.get("provider") == "ollama" and m.get("base_url")),
            "http://localhost:11434",
        )

        hw = get_hardware_status(ollama_url)
        pressure = get_memory_pressure(hw)
        suggestions = get_suggestions(hw)

        return {
            "psutil_available": hw.psutil_available,
            "cpu": {
                "name": hw.cpu.name,
                "physical_cores": hw.cpu.physical_cores,
                "logical_cores": hw.cpu.logical_cores,
                "usage_percent": hw.cpu.usage_percent,
            } if hw.cpu else None,
            "ram": {
                "total_mb": hw.ram_total_mb,
                "used_mb": hw.ram_used_mb,
                "free_mb": hw.ram_free_mb,
                "percent": hw.ram_percent,
                "pressure": pressure.value,
            },
            "gpus": [
                {
                    "name": g.name,
                    "vram_total_mb": g.vram_total_mb,
                    "vram_used_mb": g.vram_used_mb,
                    "vram_free_mb": g.vram_free_mb,
                    "vram_percent": g.vram_percent,
                }
                for g in hw.gpus
            ],
            "ollama": {
                "running": hw.ollama_running,
                "base_url": hw.ollama_base_url,
                "loaded_models": [
                    {
                        "name": m.name,
                        "size_mb": m.size_mb,
                        "expires_at": m.expires_at,
                    }
                    for m in hw.ollama_loaded_models
                ],
            },
            "suggestions": [
                {
                    "action": s.action,
                    "model": s.model,
                    "reason": s.reason,
                    "size_mb": s.size_mb,
                }
                for s in suggestions
            ],
            "error": hw.error,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UnloadRequest(BaseModel):
    model_name: str
    base_url: Optional[str] = "http://localhost:11434"


@router.post("/api/hardware/unload", tags=["Hardware"], summary="Unload Ollama model",
    description="Ask Ollama to unload a specific model from RAM/VRAM by sending `keep_alive=0`. Frees memory immediately.")
async def hardware_unload(req: UnloadRequest):
    try:
        from airvo.hardware.memory_manager import unload_ollama_model
        ok = unload_ollama_model(req.model_name, req.base_url or "http://localhost:11434")
        if not ok:
            raise HTTPException(status_code=502, detail=f"Failed to unload '{req.model_name}'")
        return {"ok": True, "model": req.model_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/hardware/fit-models", tags=["Hardware"], summary="Models that fit this machine",
    description="Returns the full Ollama model catalog annotated with fit status (fits/tight/too_large) based on current free RAM and VRAM. Updates automatically as new models are added to the catalog.")
async def hardware_fit_models(ollama_url: str = "http://localhost:11434"):
    from airvo.hardware.detector import get_hardware_status
    from airvo.hardware.fit_models import get_fit_models

    hw = get_hardware_status()
    vram_free_mb = hw.gpus[0].vram_free_mb if hw.gpus else 0.0

    return get_fit_models(
        ram_free_mb=hw.ram_free_mb,
        vram_free_mb=vram_free_mb,
        ollama_base_url=ollama_url,
    )


@router.get("/api/hardware/processes", tags=["Hardware"], summary="Top memory consumers",
    description="Returns the top processes consuming the most RAM, sorted by RSS memory. Requires psutil (`pip install airvo[hardware]`). Safe to call - read-only, no killing.")
async def hardware_processes(limit: int = 8):
    try:
        import psutil
        procs = []
        for p in psutil.process_iter(["pid", "name", "memory_info", "memory_percent"]):
            try:
                mi = p.info["memory_info"]
                if mi is None:
                    continue
                procs.append({
                    "pid": p.info["pid"],
                    "name": p.info["name"] or "Unknown",
                    "memory_mb": round(mi.rss / 1024 / 1024, 1),
                    "memory_percent": round(p.info["memory_percent"] or 0, 1),
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        procs.sort(key=lambda x: x["memory_mb"], reverse=True)
        return {"processes": procs[:limit]}
    except ImportError:
        return {"processes": [], "error": "psutil not available"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
