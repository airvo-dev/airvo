from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from airvo.config.settings import settings, save_models

router = APIRouter()
logger = logging.getLogger(__name__)


class FreeRouteSetupRequest(BaseModel):
    api_key: str
    mode: str = "add"


@router.post("/api/free-route/setup", tags=["FreeRoute"], summary="Setup Free Route")
async def free_route_setup(req: FreeRouteSetupRequest):
    from airvo.free_route.manager import setup as fr_setup

    if not req.api_key or len(req.api_key) < 8:
        raise HTTPException(status_code=400, detail="Invalid API key")
    try:
        state = fr_setup(req.api_key)
    except Exception:
        logger.exception("Free Route setup failed")
        raise HTTPException(status_code=502, detail="Free Route setup failed")

    active_ids = state.get("active_model_ids", [])
    models_by_cat = state.get("models_by_category", {})
    all_free: dict[str, dict] = {}
    for cat_models in models_by_cat.values():
        for model in cat_models:
            mid = model["id"]
            if mid not in all_free:
                all_free[mid] = model

    new_models = []
    for mid in active_ids:
        model = all_free.get(mid, {"id": mid, "name": mid})
        litellm_id = mid[len("openrouter/"):] if mid.startswith("openrouter/") else mid
        new_models.append({
            "id": litellm_id,
            "name": model.get("name", litellm_id) + " (free)",
            "provider": "openrouter",
            "api_key": req.api_key,
            "active": True,
            "free_route": True,
        })

    if req.mode == "replace":
        save_models(new_models)
    else:
        existing = settings.get_models()
        existing_ids = {m["id"] for m in existing}
        to_add = [m for m in new_models if m["id"] not in existing_ids]
        save_models(existing + to_add)

    return {
        "ok": True,
        "active_model_ids": active_ids,
        "total_free_found": state.get("total_free_found", 0),
        "mode": req.mode,
    }


@router.post("/api/free-route/refresh", tags=["FreeRoute"], summary="Refresh free model list")
async def free_route_refresh():
    from airvo.free_route.manager import refresh as fr_refresh
    try:
        state = fr_refresh()
    except Exception:
        logger.exception("Free Route refresh failed")
        raise HTTPException(status_code=502, detail="Free Route refresh failed")
    return {
        "ok": True,
        "active_model_ids": state.get("active_model_ids", []),
        "total_free_found": state.get("total_free_found", 0),
    }


@router.get("/api/free-route/status", tags=["FreeRoute"], summary="Get Free Route status")
async def free_route_status():
    from airvo.free_route.manager import get_status
    return get_status()


@router.delete("/api/free-route", tags=["FreeRoute"], summary="Disable Free Route")
async def free_route_disable():
    from airvo.free_route.manager import disable as fr_disable

    fr_disable()
    remaining = [m for m in settings.get_models() if not m.get("free_route")]
    save_models(remaining)
    return {"ok": True}


@router.post("/api/free-route/test-key", tags=["FreeRoute"], summary="Test OpenRouter API key")
async def free_route_test_key(req: FreeRouteSetupRequest):
    from airvo.free_route.manager import test_api_key

    ok = test_api_key(req.api_key)
    return {"ok": ok}
