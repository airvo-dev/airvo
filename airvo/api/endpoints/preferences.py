from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from airvo.config.settings import settings

router = APIRouter()


class PrefsUpdate(BaseModel):
    mode: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    max_history_messages: Optional[int] = None
    memory_enabled: Optional[bool] = None
    memory_text: Optional[str] = None
    agent_model: Optional[str] = None
    rag_enabled: Optional[bool] = None
    rag_path: Optional[str] = None
    rag_max_index_mb: Optional[int] = None
    rag_max_file_kb: Optional[int] = None
    rag_top_k: Optional[int] = None
    rag_max_inject_chars: Optional[int] = None
    rag_extensions: Optional[List[str]] = None
    rag_exclude_dirs: Optional[List[str]] = None
    privacy_mode_enabled: Optional[bool] = None
    cost_budget_usd: Optional[float] = None
    cost_budget_alert_pct: Optional[int] = None
    history_max_entries: Optional[int] = None
    history_enabled: Optional[bool] = None
    cache_enabled: Optional[bool] = None
    cache_ttl_seconds: Optional[int] = None
    cache_max_entries: Optional[int] = None


@router.get("/api/prefs", tags=["Preferences"], summary="Get preferences",
    description="Returns all current preferences including mode, temperature, max_tokens, RAG settings, and memory configuration.")
async def get_prefs():
    return settings.get_prefs()


@router.patch("/api/prefs", tags=["Preferences"], summary="Update preferences",
    description="Partially update preferences. Only provided fields are changed. Supports: mode, temperature, max_tokens, RAG settings, memory, agent_model.")
async def update_prefs(updates: PrefsUpdate):
    data = {k: v for k, v in updates.model_dump().items() if v is not None}
    settings.update_prefs(data)
    return {"ok": True}
