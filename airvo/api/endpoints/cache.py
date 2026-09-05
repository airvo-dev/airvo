from fastapi import APIRouter

from airvo.cache import prompt_cache as _cache

router = APIRouter()


@router.get("/api/cache/stats", tags=["Cache"], summary="Get prompt cache statistics")
def cache_stats_endpoint():
    return _cache.stats()


@router.delete("/api/cache", tags=["Cache"],
    summary="Clear prompt cache (all models or specific model)")
def cache_clear(model_id: str = ""):
    count = _cache.clear(model_id or None)
    return {"deleted": count, "model_id": model_id or "all"}
