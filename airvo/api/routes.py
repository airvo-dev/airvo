from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import litellm
import asyncio
import json
import logging

from airvo.config.settings import settings, save_models

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────
class Message(BaseModel):
    role:         str
    content:      Optional[str]  = None  # None when role=tool
    tool_calls:   Optional[List] = None  # assistant tool call requests
    tool_call_id: Optional[str]  = None  # tool result id
    name:         Optional[str]  = None  # tool name

class ChatRequest(BaseModel):
    model:        Optional[str]          = "airvo-auto"
    messages:     List[Message]
    stream:       Optional[bool]         = True
    max_tokens:   Optional[int]          = None
    temperature:  Optional[float]        = None
    tools:        Optional[List]         = None  # tool definitions from continue.dev
    tool_choice:  Optional[str | dict]   = None  # "auto", "none", or {"type":"function",...}

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
    mode:             Optional[str]        = None
    temperature:      Optional[float]      = None
    max_tokens:       Optional[int]        = None
    memory_enabled:   Optional[bool]       = None
    memory_text:      Optional[str]        = None
    # ── RAG ─────────────────────────────────────────────────────────────────
    rag_enabled:      Optional[bool]       = None
    rag_path:         Optional[str]        = None
    rag_max_index_mb: Optional[int]        = None
    rag_max_file_kb:  Optional[int]        = None
    rag_top_k:        Optional[int]        = None
    rag_extensions:   Optional[List[str]]  = None
    rag_exclude_dirs: Optional[List[str]]  = None

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

# ── Multi-model modes ────────────────────────────────────────────────────
async def parallel_mode(models: list, messages: list, request) -> list:
    """All models respond simultaneously — results shown side by side."""
    results = await asyncio.gather(*[call_model(m, messages, request) for m in models])
    return list(results)


async def race_mode(models: list, messages: list, request) -> list:
    """All models race — first successful response wins, others are cancelled."""
    tasks = [asyncio.create_task(call_model(m, messages, request)) for m in models]
    winner = None
    pending = set(tasks)

    while pending:
        done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            result = task.result()
            if not result["error"]:
                winner = result
                break
        if winner:
            for t in pending:
                t.cancel()
            break

    if not winner:
        winner = tasks[0].result() if tasks else {
            "model": "race", "name": "Race",
            "content": None, "error": "All models failed", "tokens": 0
        }

    winner["name"] = f"\U0001f3c6 {winner['name']} (Winner)"
    return [winner]


async def vote_mode(models: list, messages: list, request) -> list:
    """All models respond — a consensus is synthesised by the first model."""
    results = await asyncio.gather(*[call_model(m, messages, request) for m in models])
    valid = [r for r in results if not r["error"]]

    if len(valid) <= 1:
        return list(results)

    responses_text = "\n\n".join(
        [f"[{r['name']}]:\n{r['content']}" for r in valid]
    )
    last_user = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )
    synthesis_messages = [
        {"role": "system",
         "content": "You are a synthesis assistant. Given multiple AI responses "
                    "to the same question, identify the consensus and return the "
                    "best unified answer. Be direct and concise."},
        {"role": "user",
         "content": f"Original question:\n{last_user}\n\n"
                    f"Responses received:\n{responses_text}\n\n"
                    f"Synthesise the consensus answer:"}
    ]
    consensus = await call_model(models[0], synthesis_messages, request)
    consensus["name"] = "\U0001f5f3\ufe0f Consensus"
    return list(results) + [consensus]


async def review_mode(models: list, messages: list, request) -> list:
    """Chain review — each model refines the previous one's response.

    2 models: Generator → Reviewer
    3 models: Generator → Reviewer → Final polish
    N models: full sequential chain
    """
    if len(models) == 1:
        result = await call_model(models[0], messages, request)
        result["name"] = f"\u270d\ufe0f {result['name']}"
        return [result]

    results = []
    step_labels = ["\u270d\ufe0f", "\U0001f50d", "\u2728"]  # ✍️ 🔍 ✨

    # Step 1 — first model generates
    current = await call_model(models[0], messages, request)
    current["name"] = f"{step_labels[0]} {current['name']}"
    results.append(current)

    if current["error"]:
        return results

    # Steps 2..N — each model refines the previous response
    for i, model in enumerate(models[1:], start=1):
        label = step_labels[i] if i < len(step_labels) else "\U0001f501"  # 🔁 fallback
        is_last = (i == len(models) - 1)

        refine_prompt = (
            "You are the final editor. Read the previous response and produce a "
            "polished, complete, production-ready final answer."
            if is_last and len(models) > 2
            else
            "Review the response above. Identify any errors, gaps or improvements, "
            "then provide an enhanced version."
        )

        refine_messages = list(messages) + [
            {"role": "assistant", "content": current["content"]},
            {"role": "user",     "content": refine_prompt}
        ]

        current = await call_model(model, refine_messages, request)
        current["name"] = f"{label} {current['name']}"
        results.append(current)

        if current["error"]:
            break

    return results


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
        # Serialise messages preserving tool calling fields
        messages = []
        for m in request.messages:
            msg = {"role": m.role}
            if m.content is not None:
                msg["content"] = m.content
            if m.tool_calls is not None:
                msg["tool_calls"] = m.tool_calls
            if m.tool_call_id is not None:
                msg["tool_call_id"] = m.tool_call_id
            if m.name is not None:
                msg["name"] = m.name
            messages.append(msg)

        # Build system prompt — base + optional memory + optional RAG context
        system_content = settings.system_prompt
        memory = settings.get_memory_prompt()
        if memory:
            system_content += f"\n\n## Project Context\n{memory}"

        # ── RAG: inject relevant code chunks if enabled ──────────────────────
        prefs = settings.get_prefs()
        if prefs.get("rag_enabled") and prefs.get("rag_path", "").strip():
            try:
                from airvo.rag.retriever import retrieve, format_context
                last_user_msg = next(
                    (m["content"] for m in reversed(messages) if m["role"] == "user"),
                    None,
                )
                if last_user_msg:
                    top_k  = int(prefs.get("rag_top_k", 5))
                    chunks = retrieve(last_user_msg, top_k=top_k)
                    ctx    = format_context(chunks)
                    if ctx:
                        system_content += f"\n\n{ctx}"
            except Exception as _rag_exc:
                logger.warning(f"[RAG] context injection failed: {_rag_exc}")

        if not any(m["role"] == "system" for m in messages):
            messages.insert(0, {"role": "system", "content": system_content})

        active = settings.get_active_models()

        if not active:
            raise HTTPException(status_code=400,
                detail="No active models. Configure at least one in the dashboard.")

        # prefs already loaded above for RAG check

        # ── Tool calling — always single-model with streaming ──
        # When tools are present (Agent/Plan mode in continue.dev),
        # bypass multi-model and use the first active model directly.
        if request.tools:
            m = active[0]
            kwargs = dict(
                model       = m["id"],
                messages    = messages,
                max_tokens  = request.max_tokens  or prefs.get("max_tokens", settings.max_tokens),
                temperature = request.temperature or prefs.get("temperature", settings.temperature),
                stream      = True,
                api_key     = m.get("api_key"),
                tools       = request.tools,
            )
            if request.tool_choice is not None:
                kwargs["tool_choice"] = request.tool_choice
            if m.get("base_url"):
                kwargs["api_base"] = m["base_url"]

            response = await litellm.acompletion(**kwargs)
            return StreamingResponse(
                single_model_stream(response, m["id"]),
                media_type="text/event-stream"
            )

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

        # ── Multi-model — dispatch by mode ───────────────
        mode = prefs.get("mode", "parallel")

        if mode == "race":
            results = await race_mode(active, messages, request)
        elif mode == "vote":
            results = await vote_mode(active, messages, request)
        elif mode == "review":
            results = await review_mode(active, messages, request)
        else:  # parallel (default)
            results = await parallel_mode(active, messages, request)

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
        "version":       "0.3.0",
        "active_models": [m["id"] for m in active],
        "total_models":  len(settings.get_models()),
        "config_file":   "~/.airvo/models.json"
    }

# ── RAG endpoints ─────────────────────────────────────────────────────────

class RagIndexRequest(BaseModel):
    path:           Optional[str]       = None   # override rag_path in prefs
    max_index_mb:   Optional[int]       = None
    max_file_kb:    Optional[int]       = None
    extensions:     Optional[List[str]] = None
    exclude_dirs:   Optional[List[str]] = None


@router.get("/api/rag/status")
async def rag_status():
    """Return current index stats + whether RAG deps are installed."""
    try:
        from airvo.rag.indexer import is_rag_available, get_index_stats
        available = is_rag_available()
        if not available:
            return {
                "available":    False,
                "files_indexed": 0,
                "chunks_total":  0,
                "index_size_mb": 0.0,
                "last_indexed":  "",
            }
        stats = get_index_stats()
        prefs = settings.get_prefs()
        return {
            "available":     True,
            "rag_enabled":   prefs.get("rag_enabled", False),
            "rag_path":      prefs.get("rag_path", ""),
            "files_indexed": stats.files_indexed,
            "chunks_total":  stats.chunks_total,
            "index_size_mb": stats.index_size_mb,
            "last_indexed":  stats.last_indexed,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/rag/index")
async def rag_index(req: RagIndexRequest):
    """Trigger a (re)index of the configured directory. May take a while."""
    try:
        from airvo.rag.indexer import is_rag_available, index_directory

        if not is_rag_available():
            raise HTTPException(
                status_code=503,
                detail="RAG dependencies not installed. Run: pip install airvo[rag]"
            )

        prefs = settings.get_prefs()
        path  = (req.path or prefs.get("rag_path", "")).strip()

        if not path:
            raise HTTPException(
                status_code=400,
                detail="No directory configured. Set rag_path in preferences first."
            )

        stats = index_directory(
            path         = path,
            extensions   = req.extensions   or prefs.get("rag_extensions"),
            exclude_dirs = req.exclude_dirs  or prefs.get("rag_exclude_dirs"),
            max_file_kb  = req.max_file_kb   or prefs.get("rag_max_file_kb", 500),
            max_index_mb = req.max_index_mb  or prefs.get("rag_max_index_mb", 200),
        )

        return {
            "ok":            True,
            "files_indexed": stats.files_indexed,
            "chunks_total":  stats.chunks_total,
            "index_size_mb": stats.index_size_mb,
            "last_indexed":  stats.last_indexed,
            "errors":        stats.errors,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/rag/reset")
async def rag_reset():
    """Wipe the entire RAG index (all embeddings and metadata)."""
    try:
        from airvo.rag.indexer import clear_index
        clear_index()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Hardware / Memory Manager endpoints ──────────────────────────────────────

@router.get("/api/hardware/status")
async def hardware_status():
    """
    Return RAM usage, GPU/VRAM info, and currently loaded Ollama models.
    Works without psutil — returns partial data with available=False.
    """
    try:
        from airvo.hardware.detector import get_hardware_status, is_psutil_available
        from airvo.hardware.memory_manager import get_memory_pressure, get_suggestions

        prefs   = settings.get_prefs()
        ollama_url = next(
            (m.get("base_url", "http://localhost:11434")
             for m in settings.get_models()
             if m.get("provider") == "ollama" and m.get("base_url")),
            "http://localhost:11434",
        )

        hw = get_hardware_status(ollama_url)
        pressure    = get_memory_pressure(hw)
        suggestions = get_suggestions(hw)

        return {
            "psutil_available": hw.psutil_available,
            "ram": {
                "total_mb":  hw.ram_total_mb,
                "used_mb":   hw.ram_used_mb,
                "free_mb":   hw.ram_free_mb,
                "percent":   hw.ram_percent,
                "pressure":  pressure.value,
            },
            "gpus": [
                {
                    "name":          g.name,
                    "vram_total_mb": g.vram_total_mb,
                    "vram_used_mb":  g.vram_used_mb,
                    "vram_free_mb":  g.vram_free_mb,
                    "vram_percent":  g.vram_percent,
                }
                for g in hw.gpus
            ],
            "ollama": {
                "running":       hw.ollama_running,
                "base_url":      hw.ollama_base_url,
                "loaded_models": [
                    {
                        "name":       m.name,
                        "size_mb":    m.size_mb,
                        "expires_at": m.expires_at,
                    }
                    for m in hw.ollama_loaded_models
                ],
            },
            "suggestions": [
                {
                    "action":  s.action,
                    "model":   s.model,
                    "reason":  s.reason,
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
    base_url:   Optional[str] = "http://localhost:11434"


@router.post("/api/hardware/unload")
async def hardware_unload(req: UnloadRequest):
    """Ask Ollama to unload a specific model from memory (keep_alive=0)."""
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


# ── Discovery endpoints ───────────────────────────────────────────────────────

@router.get("/api/discovery/ollama")
async def discovery_ollama(base_url: str = "http://localhost:11434"):
    """Return the curated Ollama catalog enriched with installed + fits_ram flags."""
    try:
        from airvo.discovery.discoverer import get_ollama_discovery
        from airvo.hardware.detector import get_hardware_status, is_psutil_available

        ram_free_mb = None
        if is_psutil_available():
            hw = get_hardware_status(base_url)
            ram_free_mb = hw.ram_free_mb

        return get_ollama_discovery(base_url, ram_free_mb)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/discovery/openrouter")
async def discovery_openrouter(limit: int = 60):
    """Return available OpenRouter models (cached 5 min)."""
    try:
        from airvo.discovery.discoverer import get_openrouter_models
        return {"models": get_openrouter_models(limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class QuickAddRequest(BaseModel):
    id:       str
    name:     str
    provider: str
    base_url: Optional[str] = None


@router.post("/api/discovery/add")
async def discovery_add(req: QuickAddRequest):
    """Quick-add a discovered model to Airvo settings."""
    try:
        existing = settings.get_models()
        ids = [m["id"] for m in existing]

        # Build model id — prefix with provider for litellm routing
        if req.provider == "ollama":
            litellm_id  = f"ollama/{req.id}"
            base_url    = req.base_url or "http://localhost:11434"
            is_free     = True
        elif req.provider == "openrouter":
            litellm_id  = f"openrouter/{req.id}"
            base_url    = "https://openrouter.ai/api/v1"
            is_free     = ":free" in req.id
        else:
            litellm_id  = req.id
            base_url    = req.base_url or ""
            is_free     = False

        if litellm_id in ids:
            return {"ok": True, "model": litellm_id, "already_existed": True}

        new_model = {
            "id":       litellm_id,
            "name":     req.name,
            "provider": req.provider,
            "api_key":  "",
            "base_url": base_url,
            "active":   False,
            "free":     is_free,
            "notes":    f"Added via Model Discovery",
        }
        existing.append(new_model)
        save_models(existing)
        return {"ok": True, "model": litellm_id, "already_existed": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
