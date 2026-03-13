from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import litellm
import asyncio
import json

from airvo.config.settings import settings, save_models

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model:       Optional[str]   = "airvo-auto"
    messages:    List[Message]
    stream:      Optional[bool]  = True
    max_tokens:  Optional[int]   = None
    temperature: Optional[float] = None

class ModelUpdate(BaseModel):
    api_key:  Optional[str]  = None
    active:   Optional[bool] = None
    base_url: Optional[str]  = None
    name:     Optional[str]  = None
    notes:    Optional[str]  = None

class NewModel(BaseModel):
    id:       str
    name:     str
    provider: str
    api_key:  Optional[str]  = None
    base_url: Optional[str]  = None
    active:   bool           = False
    free:     bool           = False
    notes:    Optional[str]  = ""

class PrefsUpdate(BaseModel):
    mode:            Optional[str]   = None
    temperature:     Optional[float] = None
    max_tokens:      Optional[int]   = None
    memory_enabled:  Optional[bool]  = None
    memory_text:     Optional[str]   = None

# ── Dynamic model call ────────────────────────────────────────────────────
async def call_model(model_config: dict, messages: list, request):
    try:
        prefs = settings.get_prefs()
        kwargs = dict(
            model       = model_config["id"],
            messages    = messages,
            max_tokens  = request.max_tokens  or prefs.get("max_tokens", settings.max_tokens),
            temperature = request.temperature or prefs.get("temperature", settings.temperature),
            stream      = False,
            api_key     = model_config.get("api_key"),
        )
        if model_config.get("base_url"):
            kwargs["api_base"] = model_config["base_url"]

        response = await litellm.acompletion(**kwargs)

        # Record usage stats
        usage  = response.usage
        tokens = (usage.total_tokens if usage and usage.total_tokens else 0)
        settings.record_usage(model_config["id"], tokens)

        return {
            "model":   model_config["id"],
            "name":    model_config.get("name", model_config["id"]),
            "content": response.choices[0].message.content,
            "error":   None,
            "tokens":  tokens
        }
    except Exception as e:
        return {
            "model":   model_config["id"],
            "name":    model_config.get("name", model_config["id"]),
            "content": None,
            "error":   str(e),
            "tokens":  0
        }

# ── Streaming helpers ─────────────────────────────────────────────────────
async def single_model_stream(response, model_id: str):
    total_tokens = 0
    async for chunk in response:
        if hasattr(chunk, "usage") and chunk.usage:
            total_tokens = chunk.usage.total_tokens or 0
        yield f"data: {json.dumps(chunk.model_dump())}\n\n"
    if total_tokens > 0:
        settings.record_usage(model_id, total_tokens)
    yield "data: [DONE]\n\n"

async def multi_model_stream(results):
    combined = ""
    for r in results:
        if r["error"]:
            combined += f"**{r['name']}:**\n\u274c {r['error']}\n\n---\n\n"
        else:
            combined += f"**{r['name']}:**\n{r['content']}\n\n---\n\n"

    chunk_size = 10
    for i in range(0, len(combined), chunk_size):
        chunk = {
            "id": "airvo-multi", "object": "chat.completion.chunk",
            "model": "airvo-auto",
            "choices": [{"index": 0,
                "delta": {"content": combined[i:i+chunk_size]},
                "finish_reason": None}]
        }
        yield f"data: {json.dumps(chunk)}\n\n"

    yield f"data: {json.dumps({'id':'airvo-multi','object':'chat.completion.chunk','model':'airvo-auto','choices':[{'index':0,'delta':{},'finish_reason':'stop'}]})}\n\n"
    yield "data: [DONE]\n\n"

# ── Chat endpoint ─────────────────────────────────────────────────────────
@router.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    try:
        messages = [{"role": m.role, "content": m.content}
                    for m in request.messages]

        # Build system prompt — base + optional memory
        system_content = settings.system_prompt
        memory = settings.get_memory_prompt()
        if memory:
            system_content += f"\n\n## Project Context\n{memory}"

        if not any(m["role"] == "system" for m in messages):
            messages.insert(0, {"role": "system", "content": system_content})

        active = settings.get_active_models()

        if not active:
            raise HTTPException(status_code=400,
                detail="No active models. Configure at least one in the dashboard.")

        prefs = settings.get_prefs()

        # ── Single model — real streaming ─────────────────
        if len(active) == 1:
            m = active[0]
            kwargs = dict(
                model       = m["id"],
                messages    = messages,
                max_tokens  = request.max_tokens  or prefs.get("max_tokens", settings.max_tokens),
                temperature = request.temperature or prefs.get("temperature", settings.temperature),
                stream      = True,
                api_key     = m.get("api_key"),
            )
            if m.get("base_url"):
                kwargs["api_base"] = m["base_url"]

            response = await litellm.acompletion(**kwargs)
            return StreamingResponse(
                single_model_stream(response, m["id"]),
                media_type="text/event-stream"
            )

        # ── Multi-model parallel ──────────────────────────
        results = await asyncio.gather(
            *[call_model(m, messages, request) for m in active]
        )
        return StreamingResponse(
            multi_model_stream(results),
            media_type="text/event-stream"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Dashboard API — CRUD models ───────────────────────────────────────────

@router.get("/api/models")
async def get_models():
    return {"models": settings.get_models()}

@router.get("/api/models/active")
async def get_active():
    return {"models": settings.get_active_models()}

@router.post("/api/models")
async def add_model(model: NewModel):
    settings.add_model(model.model_dump())
    return {"ok": True, "model": model.id}

# IMPORTANT: /toggle and /key must be BEFORE /{model_id:path}
@router.patch("/api/models/{model_id:path}/toggle")
async def toggle_model(model_id: str, active: bool):
    settings.toggle_model(model_id, active)
    return {"ok": True, "active": active}

@router.patch("/api/models/{model_id:path}/key")
async def set_api_key(model_id: str, api_key: str):
    settings.set_api_key(model_id, api_key)
    return {"ok": True}

@router.patch("/api/models/{model_id:path}")
async def update_model(model_id: str, updates: ModelUpdate):
    data = {k: v for k, v in updates.model_dump().items() if v is not None}
    settings.update_model(model_id, data)
    return {"ok": True}

@router.delete("/api/models/{model_id:path}")
async def delete_model(model_id: str):
    settings.delete_model(model_id)
    return {"ok": True}

# ── Preferences endpoints ─────────────────────────────────────────────────

@router.get("/api/prefs")
async def get_prefs():
    return settings.get_prefs()

@router.patch("/api/prefs")
async def update_prefs(updates: PrefsUpdate):
    data = {k: v for k, v in updates.model_dump().items() if v is not None}
    settings.update_prefs(data)
    return {"ok": True}

# ── Stats endpoints ───────────────────────────────────────────────────────

@router.get("/api/stats")
async def get_stats():
    return {"stats": settings.get_stats()}

@router.delete("/api/stats")
async def reset_stats():
    settings.reset_stats()
    return {"ok": True}

# ── Standard endpoints ────────────────────────────────────────────────────

@router.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [{"id": "airvo-auto", "object": "model", "owned_by": "airvo"}]
    }

@router.get("/api/health")
async def health():
    active = settings.get_active_models()
    return {
        "status":        "ok",
        "version":       "0.1.0",
        "active_models": [m["id"] for m in active],
        "total_models":  len(settings.get_models()),
        "config_file":   "~/.airvo/models.json"
    }
