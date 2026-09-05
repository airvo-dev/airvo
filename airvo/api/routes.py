from fastapi import APIRouter

from airvo.config.settings import settings
from airvo.api.endpoints.models import router as models_router
from airvo.api.endpoints.preferences import router as preferences_router
from airvo.api.endpoints.smart_router import router as smart_router_router
from airvo.api.endpoints.chat_completions import router as chat_completions_router
from airvo.api.endpoints.compare import router as compare_router
from airvo.api.endpoints.chat_history import router as chat_history_router
from airvo.api.endpoints.rag import router as rag_router
from airvo.api.endpoints.hardware import router as hardware_router
from airvo.api.endpoints.discovery import router as discovery_router
from airvo.api.endpoints.privacy import router as privacy_router
from airvo.api.endpoints.costing import router as costing_router
from airvo.api.endpoints.history import router as history_router
from airvo.api.endpoints.cache import router as cache_router
from airvo.api.endpoints.free_route import router as free_route_router
from airvo.api.endpoints.bench import router as bench_router
from airvo.api.endpoints.stats import router as stats_router
from airvo.api.endpoints.ratings import router as ratings_router

router = APIRouter()
router.include_router(chat_completions_router)
router.include_router(models_router)
router.include_router(preferences_router)
router.include_router(smart_router_router)
router.include_router(compare_router)
router.include_router(chat_history_router)
router.include_router(rag_router)
router.include_router(hardware_router)
router.include_router(discovery_router)
router.include_router(privacy_router)
router.include_router(costing_router)
router.include_router(history_router)
router.include_router(cache_router)
router.include_router(free_route_router)
router.include_router(bench_router)
router.include_router(stats_router)
router.include_router(ratings_router)

# ── Standard endpoints ────────────────────────────────────────────────────

@router.get("/v1/models", tags=["Chat"], summary="List models (OpenAI compat)",
    description="OpenAI-compatible model list. Returns `airvo-auto` as the virtual model that Airvo routes to your configured providers.")
async def list_models():
    return {
        "object": "list",
        "data": [{"id": "airvo-auto", "object": "model", "owned_by": "airvo"}]
    }

@router.get("/api/health", tags=["Health"], summary="Health check",
    description="Returns server status, version, active models, total model count, config file path, and last request diagnostics.")
async def health():
    from importlib.metadata import version as _v
    active = settings.get_active_models()
    return {
        "status":        "ok",
        "version":       _v("airvo"),
        "active_models": [m["id"] for m in active],
        "total_models":  len(settings.get_models()),
        "config_file":   "~/.airvo/models.json",
        "last_request":  settings.get_last_request(),
    }




