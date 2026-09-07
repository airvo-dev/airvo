from typing import Optional
import asyncio
import time
import logging

import litellm
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from airvo.config.settings import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class ModelUpdate(BaseModel):
    api_key: Optional[str] = None
    active: Optional[bool] = None
    base_url: Optional[str] = None
    name: Optional[str] = None
    notes: Optional[str] = None


class NewModel(BaseModel):
    id: str
    name: str
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    active: bool = False
    free: bool = False
    notes: Optional[str] = ""


class TestConnectionRequest(BaseModel):
    model_id: str


@router.get("/api/models", tags=["Models"], summary="List all models",
    description="Returns all configured models including inactive ones and suggestions.")
async def get_models():
    return {"models": settings.get_models()}


@router.get("/api/models/active", tags=["Models"], summary="List active models",
    description="Returns only models with `active: true`. These are the models used for chat completions.")
async def get_active():
    return {"models": settings.get_active_models()}


@router.post("/api/models", tags=["Models"], summary="Add a new model",
    description="Add a new model configuration. The model ID should follow the `provider/model-name` format (e.g. `groq/llama-3.1-8b-instant`).")
async def add_model(model: NewModel):
    settings.add_model(model.model_dump())
    return {"ok": True, "model": model.id}


@router.patch("/api/models/{model_id:path}/toggle", tags=["Models"], summary="Toggle model active/inactive",
    description="Enable or disable a model. Only active models are used for chat completions.")
async def toggle_model(model_id: str, active: bool):
    settings.toggle_model(model_id, active)
    return {"ok": True, "active": active}


@router.patch("/api/models/{model_id:path}/key", tags=["Models"], summary="Set API key",
    description="Set or update the API key for a specific model. The key is stored locally in `~/.airvo/models.json`.")
async def set_api_key(model_id: str, api_key: str):
    settings.set_api_key(model_id, api_key)
    return {"ok": True}


@router.patch("/api/models/{model_id:path}", tags=["Models"], summary="Update model fields",
    description="Partially update a model's configuration (name, base_url, notes, etc.). Only provided fields are updated.")
async def update_model(model_id: str, updates: ModelUpdate):
    data = {k: v for k, v in updates.model_dump().items() if v is not None}
    settings.update_model(model_id, data)
    return {"ok": True}


@router.delete("/api/models/{model_id:path}", tags=["Models"], summary="Delete a model",
    description="Permanently remove a model configuration. This cannot be undone.")
async def delete_model(model_id: str):
    settings.delete_model(model_id)
    return {"ok": True}


@router.post("/api/model-test", tags=["Models"], summary="Test model API key",
    description="Make a minimal call to verify a model's API key and connectivity. Returns ok and latency_ms.")
async def test_model_connection(req: TestConnectionRequest):
    models_list = settings.get_models()
    model = next((m for m in models_list if m["id"] == req.model_id), None)
    if not model:
        raise HTTPException(404, f"Model not found: {req.model_id}")
    kwargs: dict = {
        "model": req.model_id,
        "messages": [{"role": "user", "content": "Reply with the single word: ok"}],
        "max_tokens": 5,
        "stream": False,
    }
    if model.get("api_key"):
        kwargs["api_key"] = model["api_key"]
    if model.get("base_url"):
        kwargs["api_base"] = model["base_url"]
    start = time.time()
    try:
        await litellm.acompletion(**kwargs)
        return {"ok": True, "latency_ms": round((time.time() - start) * 1000)}
    except Exception as exc:
        logger.warning("Model connection test failed for %s: %s", req.model_id, type(exc).__name__)
        return {"ok": False, "error": "Connection test failed"}


@router.get("/api/health/providers", tags=["Models"], summary="Health check all active models",
    description="Pings every active model concurrently with a 1-token request. Returns status and latency_ms per model.")
async def health_providers():
    active = settings.get_active_models()

    async def _ping(model: dict) -> dict:
        kwargs: dict = {
            "model": model["id"],
            "messages": [{"role": "user", "content": "ok"}],
            "max_tokens": 1,
            "stream": False,
        }
        if model.get("api_key"):
            kwargs["api_key"] = model["api_key"]
        if model.get("base_url"):
            kwargs["api_base"] = model["base_url"]
        start = time.time()
        try:
            await litellm.acompletion(**kwargs)
            return {
                "model_id": model["id"],
                "name": model.get("name", model["id"]),
                "provider": model.get("provider", ""),
                "ok": True,
                "latency_ms": round((time.time() - start) * 1000),
            }
        except Exception as exc:
            return {
                "model_id": model["id"],
                "name": model.get("name", model["id"]),
                "provider": model.get("provider", ""),
                "ok": False,
                "latency_ms": None,
                "error": "Request failed",
            }

    results = await asyncio.gather(*[_ping(m) for m in active])
    return {"results": list(results)}
