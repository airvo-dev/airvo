from typing import Optional
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from airvo.config.settings import settings, save_models

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/api/discovery/ollama", tags=["Discovery"], summary="Ollama model catalog",
    description="Returns a curated catalog of 21 Ollama models organized by size (tiny/small/medium/large). Each entry includes `installed` (already pulled) and `fits_ram` (enough free memory) flags.")
async def discovery_ollama(base_url: str = "http://localhost:11434"):
    try:
        from airvo.discovery.discoverer import get_ollama_discovery
        from airvo.hardware.detector import get_hardware_status, is_psutil_available

        ram_free_mb = None
        if is_psutil_available():
            hw = get_hardware_status(base_url)
            ram_free_mb = hw.ram_free_mb

        return get_ollama_discovery(base_url, ram_free_mb)
    except Exception:
        logger.exception("Failed to fetch Ollama discovery data")
        raise HTTPException(status_code=500, detail="Failed to fetch Ollama discovery data")


@router.get("/api/discovery/openrouter", tags=["Discovery"], summary="OpenRouter models",
    description="Fetches available models from OpenRouter's public API. Results are cached for 5 minutes. Free models are listed first. Returns: id, name, description, context_length, is_free, prompt_cost.")
async def discovery_openrouter(limit: int = 60):
    try:
        from airvo.discovery.discoverer import get_openrouter_models
        return {"models": get_openrouter_models(limit)}
    except Exception:
        logger.exception("Failed to fetch OpenRouter discovery data")
        raise HTTPException(status_code=500, detail="Failed to fetch OpenRouter discovery data")


class QuickAddRequest(BaseModel):
    id: str
    name: str
    provider: str
    base_url: Optional[str] = None


@router.post("/api/discovery/add", tags=["Discovery"], summary="Quick-add model",
    description="Add a discovered model (Ollama or OpenRouter) to your Airvo configuration. The model is added as inactive - enable it in the dashboard or via PATCH /api/models/{id}/toggle.")
async def discovery_add(req: QuickAddRequest):
    try:
        existing = settings.get_models()
        ids = [m["id"] for m in existing]

        if req.provider == "ollama":
            litellm_id = f"ollama/{req.id}"
            base_url = req.base_url or "http://localhost:11434"
            is_free = True
        elif req.provider == "openrouter":
            litellm_id = f"openrouter/{req.id}"
            base_url = "https://openrouter.ai/api/v1"
            is_free = ":free" in req.id
        else:
            litellm_id = req.id
            base_url = req.base_url or ""
            is_free = False

        if litellm_id in ids:
            return {"ok": True, "model": litellm_id, "already_existed": True}

        new_model = {
            "id": litellm_id,
            "name": req.name,
            "provider": req.provider,
            "api_key": "",
            "base_url": base_url,
            "active": False,
            "free": is_free,
            "notes": "Added via Model Discovery",
        }
        existing.append(new_model)
        save_models(existing)
        return {"ok": True, "model": litellm_id, "already_existed": False}
    except Exception:
        logger.exception("Failed to add discovery model")
        raise HTTPException(status_code=500, detail="Failed to add model")
