from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import litellm
import asyncio
import json
import logging
import os
import time
from collections import deque

from airvo.config.settings import settings, save_models

logger = logging.getLogger(__name__)

_HISTORY_FILE = os.path.join(os.path.expanduser("~"), ".airvo", "compare_history.json")

def _load_history() -> deque:
    try:
        if os.path.exists(_HISTORY_FILE):
            with open(_HISTORY_FILE, "r", encoding="utf-8") as f:
                return deque(json.load(f), maxlen=10)
    except Exception:
        pass
    return deque(maxlen=10)

def _save_history() -> None:
    try:
        with open(_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(list(_compare_store), f, ensure_ascii=False, indent=2)
    except Exception as _e:
        logger.warning("[Compare] Failed to save history: %s", _e)

_compare_store: deque = _load_history()  # persisted across restarts

router = APIRouter()

# ── Per-provider TPM / context limits ────────────────────────────────────
# Add any provider here that has strict rate limits on free tiers.
# max_output : cap for max_tokens sent to the API (~output tokens)
# max_msg_chars : cap per history message content (prevents huge input tokens)
# Providers NOT listed here are uncapped (OpenAI, Anthropic, Ollama, etc.)
_PROVIDER_LIMITS: dict[str, dict] = {
    "groq":       {"max_output": 1500, "max_msg_chars": 1500},  # 6k TPM free — tight budget
    "together":   {"max_output": 2000, "max_msg_chars": 2000},  # ~10k TPM free
    "cerebras":   {"max_output": 2000, "max_msg_chars": 2000},  # ~10k TPM free
    "novita":     {"max_output": 2000, "max_msg_chars": 2000},  # varies
    "openrouter": {"max_output": 2000, "max_msg_chars": 2000},  # free models vary
}

def _provider(model_id: str) -> str:
    return (model_id or "").split("/")[0].lower()

def _safe_max_tokens(model_id: str, requested: int) -> int:
    """Cap output tokens for providers with strict TPM limits."""
    cap = _PROVIDER_LIMITS.get(_provider(model_id), {}).get("max_output")
    return min(requested, cap) if cap else requested

def _msg_char_cap(active_models: list) -> int | None:
    """Return the tightest max_msg_chars across all active models, or None if uncapped."""
    caps = [
        _PROVIDER_LIMITS[_provider(m["id"])]["max_msg_chars"]
        for m in active_models
        if _provider(m["id"]) in _PROVIDER_LIMITS
    ]
    return min(caps) if caps else None

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
    max_history_messages: Optional[int]   = None
    memory_enabled:   Optional[bool]       = None
    memory_text:      Optional[str]        = None
    agent_model:      Optional[str]        = None
    # ── RAG ─────────────────────────────────────────────────────────────────
    rag_enabled:      Optional[bool]       = None
    rag_path:         Optional[str]        = None
    rag_max_index_mb: Optional[int]        = None
    rag_max_file_kb:  Optional[int]        = None
    rag_top_k:        Optional[int]        = None
    rag_max_inject_chars: Optional[int]     = None
    rag_extensions:   Optional[List[str]]  = None
    rag_exclude_dirs: Optional[List[str]]  = None

# ── Dynamic model call ────────────────────────────────────────────────────
async def call_model(model_config: dict, messages: list, request):
    try:
        prefs = settings.get_prefs()
        _raw_max = request.max_tokens or prefs.get("max_tokens", settings.max_tokens)
        _capped  = _safe_max_tokens(model_config["id"], _raw_max)
        _total_chars = sum(len(m.get("content") or "") for m in messages)
        logger.warning(
            "[TPM-DEBUG] model=%s  raw_max=%s  capped=%s  msgs=%d  total_chars=%d",
            model_config["id"], _raw_max, _capped, len(messages), _total_chars
        )
        kwargs = dict(
            model       = model_config["id"],
            messages    = messages,
            max_tokens  = _capped,
            temperature = request.temperature or prefs.get("temperature", settings.temperature),
            stream      = False,
            api_key     = model_config.get("api_key"),
        )
        if model_config.get("base_url"):
            kwargs["api_base"] = model_config["base_url"]

        _t0 = time.time()
        response = await litellm.acompletion(**kwargs)
        _elapsed = round(time.time() - _t0, 2)

        # Record usage stats
        usage  = response.usage
        tokens = (usage.total_tokens if usage and usage.total_tokens else 0)
        settings.record_usage(model_config["id"], tokens)

        return {
            "model":     model_config["id"],
            "name":      model_config.get("name", model_config["id"]),
            "content":   response.choices[0].message.content,
            "error":     None,
            "tokens":    tokens,
            "elapsed_s": _elapsed,
        }
    except Exception as e:
        return {
            "model":     model_config["id"],
            "name":      model_config.get("name", model_config["id"]),
            "content":   None,
            "error":     str(e),
            "tokens":    0,
            "elapsed_s": None,
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
@router.post("/v1/chat/completions", tags=["Chat"], summary="Chat completion (streaming)",
    description="OpenAI-compatible chat completion endpoint with SSE streaming.\n\n"
    "**Single model:** Real token-by-token streaming.\n"
    "**Multi-model:** All models run, results combined and streamed.\n"
    "**Tool calling:** When `tools` is present, uses the configured agent model.\n\n"
    "The server automatically:\n"
    "- Caps `max_tokens` for free-tier providers (TPM guard)\n"
    "- Injects RAG context from your indexed codebase (if enabled)\n"
    "- Truncates history to the last N messages\n"
    "- Dispatches to the configured multi-model mode (parallel/race/vote/review)")
async def chat_completions(request: ChatRequest):
    try:
        # ── EARLY: force-cap max_tokens for ALL Groq-limited providers ───
        # This runs before ANY code path (tool_call, single, multi).
        # continue.dev may send max_tokens=4096 which exceeds Groq 6k TPM.
        _active = settings.get_active_models()
        _active_providers = {_provider(m["id"]) for m in _active}
        _lowest_cap = None
        for p in _active_providers:
            c = _PROVIDER_LIMITS.get(p, {}).get("max_output")
            if c and (_lowest_cap is None or c < _lowest_cap):
                _lowest_cap = c
        if _lowest_cap and request.max_tokens and request.max_tokens > _lowest_cap:
            logger.warning("[TPM-GUARD] request.max_tokens %d → capped to %d",
                           request.max_tokens, _lowest_cap)
            request.max_tokens = _lowest_cap
        elif _lowest_cap and not request.max_tokens:
            request.max_tokens = _lowest_cap
            logger.warning("[TPM-GUARD] request.max_tokens was None → set to %d",
                           _lowest_cap)

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
                        # Hard cap: ~1500 chars ≈ 375 tokens to avoid TPM limits
                        max_rag_chars = int(prefs.get("rag_max_inject_chars", 1500))
                        if len(ctx) > max_rag_chars:
                            ctx = ctx[:max_rag_chars] + "\n... [RAG context truncated]"
                        system_content += f"\n\n{ctx}"
            except Exception as _rag_exc:
                logger.warning(f"[RAG] context injection failed: {_rag_exc}")

        if not any(m["role"] == "system" for m in messages):
            messages.insert(0, {"role": "system", "content": system_content})

        # ── History truncation — keep system + last N messages ───────────────
        # Prevents hitting TPM limits on free tiers (Groq: 6k-12k TPM)
        # Each message pair (user+assistant) is ~500-2000 tokens on average.
        max_history = int(prefs.get("max_history_messages", 10))
        system_msgs = [m for m in messages if m["role"] == "system"]
        other_msgs  = [m for m in messages if m["role"] != "system"]
        if len(other_msgs) > max_history:
            other_msgs = other_msgs[-max_history:]

        # ── Per-message char cap — only for providers with strict TPM limits ─
        # Uses _PROVIDER_LIMITS to determine the tightest cap across all active
        # models. Paid/local providers (OpenAI, Anthropic, Ollama) are uncapped.
        _char_cap = _msg_char_cap(settings.get_active_models())
        if _char_cap:
            trimmed = []
            for m in other_msgs:
                content = m.get("content") or ""
                if isinstance(content, str) and len(content) > _char_cap:
                    m = dict(m)
                    m["content"] = content[:_char_cap] + " … [trimmed]"
                trimmed.append(m)
            other_msgs = trimmed

        messages = system_msgs + other_msgs

        active = settings.get_active_models()

        if not active:
            raise HTTPException(status_code=400,
                detail="No active models. Configure at least one in the dashboard.")

        # prefs already loaded above for RAG check

        # ── Tool calling — always single-model with streaming ──
        # When tools are present (Agent/Plan mode in continue.dev),
        # bypass multi-model and use the first active model directly.
        if request.tools:
            agent_model_id = prefs.get("agent_model", "")
            m = next((x for x in active if x["id"] == agent_model_id), active[0])
            _raw_max = request.max_tokens or prefs.get("max_tokens", settings.max_tokens)
            kwargs = dict(
                model       = m["id"],
                messages    = messages,
                max_tokens  = _safe_max_tokens(m["id"], _raw_max),
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
            settings.record_last_request("tool_call", model=m.get("name", m["id"]))
            return StreamingResponse(
                single_model_stream(response, m["id"]),
                media_type="text/event-stream"
            )

        # ── Single model — real streaming ─────────────────
        if len(active) == 1:
            m = active[0]
            _raw_max = request.max_tokens or prefs.get("max_tokens", settings.max_tokens)
            kwargs = dict(
                model       = m["id"],
                messages    = messages,
                max_tokens  = _safe_max_tokens(m["id"], _raw_max),
                temperature = request.temperature or prefs.get("temperature", settings.temperature),
                stream      = True,
                api_key     = m.get("api_key"),
            )
            if m.get("base_url"):
                kwargs["api_base"] = m["base_url"]

            response = await litellm.acompletion(**kwargs)
            settings.record_last_request("single", model=m.get("name", m["id"]))
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

        # ── Save for Compare view ─────────────────────────────────────────
        _last_prompt = next(
            (m["content"] for m in reversed(messages)
             if m["role"] == "user" and isinstance(m.get("content"), str)),
            "",
        )
        _compare_store.appendleft({
            "id":        str(time.time()),
            "timestamp": time.time(),
            "mode":      mode,
            "prompt":    _last_prompt[:500],
            "results": [
                {
                    "model":     r["model"],
                    "name":      r["name"],
                    "content":   r["content"],
                    "error":     r["error"],
                    "tokens":    r["tokens"],
                    "elapsed_s": r.get("elapsed_s"),
                }
                for r in results
            ],
        })
        _save_history()

        settings.record_last_request("multi", mode=mode)
        return StreamingResponse(
            multi_model_stream(results),
            media_type="text/event-stream"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Dashboard API — CRUD models ───────────────────────────────────────────

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

# IMPORTANT: /toggle and /key must be BEFORE /{model_id:path}
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

# ── Preferences endpoints ─────────────────────────────────────────────────

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

# ── Stats endpoints ───────────────────────────────────────────────────────

@router.get("/api/stats", tags=["Stats"], summary="Get usage statistics",
    description="Returns per-model usage stats: `{model_id: {requests: N, tokens: N}}`. Persisted in `~/.airvo/stats.json`.")
async def get_stats():
    return {"stats": settings.get_stats()}

@router.delete("/api/stats", tags=["Stats"], summary="Reset statistics",
    description="Reset all usage statistics to zero for every model.")
async def reset_stats():
    settings.reset_stats()
    return {"ok": True}

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

# ── RAG endpoints ─────────────────────────────────────────────────────────

class RagIndexRequest(BaseModel):
    path:           Optional[str]       = None   # override rag_path in prefs
    max_index_mb:   Optional[int]       = None
    max_file_kb:    Optional[int]       = None
    extensions:     Optional[List[str]] = None
    exclude_dirs:   Optional[List[str]] = None


@router.get("/api/rag/status", tags=["RAG"], summary="RAG index status",
    description="Returns current index statistics and whether RAG dependencies (chromadb, sentence-transformers) are installed. "
    "Install with: `pip install airvo[rag]`.")
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


@router.post("/api/rag/index", tags=["RAG"], summary="Index a directory",
    description="Trigger indexing of a codebase directory. Walks the directory recursively, chunks text files, generates embeddings, "
    "and stores them in a local ChromaDB collection. Can take 10-60 seconds depending on project size.")
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


@router.delete("/api/rag/reset", tags=["RAG"], summary="Reset RAG index",
    description="Wipe the entire ChromaDB collection — all embeddings and metadata are deleted. You'll need to re-index afterwards.")
async def rag_reset():
    """Wipe the entire RAG index (all embeddings and metadata)."""
    try:
        from airvo.rag.indexer import clear_index
        clear_index()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Hardware / Memory Manager endpoints ──────────────────────────────────────

@router.get("/api/hardware/status", tags=["Hardware"], summary="Hardware status",
    description="Returns RAM usage, GPU/VRAM info, loaded Ollama models, memory pressure level, and smart suggestions. "
    "Works without psutil (returns partial data). Install with: `pip install airvo[hardware]`.")
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
            "cpu": {
                "name":           hw.cpu.name,
                "physical_cores": hw.cpu.physical_cores,
                "logical_cores":  hw.cpu.logical_cores,
                "usage_percent":  hw.cpu.usage_percent,
            } if hw.cpu else None,
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


@router.post("/api/hardware/unload", tags=["Hardware"], summary="Unload Ollama model",
    description="Ask Ollama to unload a specific model from RAM/VRAM by sending `keep_alive=0`. Frees memory immediately.")
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

@router.get("/api/hardware/processes", tags=["Hardware"], summary="Top memory consumers",
    description="Returns the top processes consuming the most RAM, sorted by RSS memory. "
    "Requires psutil (`pip install airvo[hardware]`). Safe to call — read-only, no killing.")
async def hardware_processes(limit: int = 8):
    """
    Return the top N processes consuming the most RAM.
    Never raises — returns empty list if psutil is unavailable.
    """
    try:
        import psutil
        procs = []
        for p in psutil.process_iter(["pid", "name", "memory_info", "memory_percent"]):
            try:
                mi = p.info["memory_info"]
                if mi is None:
                    continue
                procs.append({
                    "pid":            p.info["pid"],
                    "name":           p.info["name"] or "Unknown",
                    "memory_mb":      round(mi.rss / 1024 / 1024, 1),
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


# ── Compare endpoint ──────────────────────────────────────────────────────

@router.get("/api/compare/latest", tags=["Compare"], summary="Last multi-model comparison",
    description="Returns the most recent multi-model response data for side-by-side comparison "
    "in the Airvo dashboard. Updated automatically after every multi-model chat completion.")
async def compare_latest():
    """Return the last multi-model response for the Compare view."""
    if not _compare_store:
        return {"data": None}
    return {"data": _compare_store[0]}


@router.get("/api/compare/history", tags=["Compare"], summary="Compare history (last 10)",
    description="Returns the last 10 multi-model comparisons in reverse chronological order.")
async def compare_history():
    """Return up to the last 10 multi-model responses."""
    return {"history": list(_compare_store)}


@router.delete("/api/compare/history", tags=["Compare"], summary="Clear compare history",
    description="Clears all compare history entries from memory and from disk.")
async def compare_clear_history():
    """Clear all compare history."""
    _compare_store.clear()
    _save_history()
    return {"ok": True}


class CompareRunRequest(BaseModel):
    prompt:             str
    max_tokens:         Optional[int]   = None
    temperature:        Optional[float] = None
    model_temperatures: Optional[dict]  = None  # {model_id: temperature}


@router.post("/api/compare/run", tags=["Compare"], summary="Run a comparison from the dashboard",
    description="Send a prompt directly from the Compare tab. All active models respond in parallel "
    "(or the configured mode). Result is saved to compare history and returned immediately.")
async def compare_run(req: CompareRunRequest):
    """Fire a comparison from the dashboard without an external chat client."""
    try:
        active = settings.get_active_models()
        if len(active) < 2:
            raise HTTPException(status_code=400,
                detail="Need at least 2 active models to compare.")
        prefs = settings.get_prefs()
        messages = [
            {"role": "system", "content": settings.system_prompt},
            {"role": "user",   "content": req.prompt},
        ]

        class _FakeReq:
            max_tokens  = req.max_tokens
            temperature = req.temperature

        mode = prefs.get("mode", "parallel")
        if mode == "race":
            results = await race_mode(active, messages, _FakeReq())
        elif mode == "vote":
            results = await vote_mode(active, messages, _FakeReq())
        elif mode == "review":
            results = await review_mode(active, messages, _FakeReq())
        else:
            results = await parallel_mode(active, messages, _FakeReq())

        entry = {
            "id":        str(time.time()),
            "timestamp": time.time(),
            "mode":      mode,
            "prompt":    req.prompt[:500],
            "results": [
                {
                    "model":     r["model"],
                    "name":      r["name"],
                    "content":   r["content"],
                    "error":     r["error"],
                    "tokens":    r["tokens"],
                    "elapsed_s": r.get("elapsed_s"),
                }
                for r in results
            ],
        }
        _compare_store.appendleft(entry)
        _save_history()
        settings.record_last_request("multi", mode=mode)
        return {"data": entry}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Per-model SSE streaming helper ───────────────────────────────────────
async def _stream_one_model(model_cfg: dict, messages: list, req_obj, idx: int, queue: asyncio.Queue):
    """Stream one model's tokens into a shared queue for SSE."""
    t0 = time.time()
    content = ""
    tokens = 0
    try:
        prefs = settings.get_prefs()
        _raw_max = req_obj.max_tokens or prefs.get("max_tokens", settings.max_tokens)
        _model_temps = getattr(req_obj, "model_temperatures", None) or {}
        _temp = _model_temps.get(model_cfg["id"])
        kwargs = dict(
            model       = model_cfg["id"],
            messages    = messages,
            max_tokens  = _safe_max_tokens(model_cfg["id"], _raw_max),
            temperature = _temp if _temp is not None else (req_obj.temperature or prefs.get("temperature", settings.temperature)),
            stream      = True,
            api_key     = model_cfg.get("api_key"),
        )
        if model_cfg.get("base_url"):
            kwargs["api_base"] = model_cfg["base_url"]
        await queue.put(json.dumps({
            "type": "start", "model_idx": idx,
            "name": model_cfg.get("name", model_cfg["id"]),
            "model": model_cfg["id"],
        }))
        response = await litellm.acompletion(**kwargs)
        async for chunk in response:
            if chunk.choices:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    content += delta
                    await queue.put(json.dumps({"type": "delta", "model_idx": idx, "delta": delta}))
            if hasattr(chunk, "usage") and chunk.usage and chunk.usage.total_tokens:
                tokens = chunk.usage.total_tokens
        elapsed = round(time.time() - t0, 2)
        if tokens == 0:
            tokens = max(1, len(content.split()))
        settings.record_usage(model_cfg["id"], tokens)
        await queue.put(json.dumps({
            "type": "done", "model_idx": idx,
            "tokens": tokens, "elapsed_s": elapsed, "content": content,
        }))
    except Exception as e:
        await queue.put(json.dumps({
            "type": "error", "model_idx": idx, "error": str(e), "content": content,
        }))


@router.post("/api/compare/stream", tags=["Compare"],
    summary="Streaming comparison (SSE)",
    description="Like /api/compare/run but streams each model's tokens in real time via SSE. "
    "Events: start | delta | done | error | complete.")
async def compare_stream_run(req: CompareRunRequest):
    """Run a comparison and stream each model's tokens as SSE events."""
    active = settings.get_active_models()
    if len(active) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 active models.")
    prefs = settings.get_prefs()
    mode  = prefs.get("mode", "parallel")
    messages = [
        {"role": "system", "content": settings.system_prompt},
        {"role": "user",   "content": req.prompt},
    ]

    class _FakeReq:
        max_tokens         = req.max_tokens
        temperature        = req.temperature
        model_temperatures = req.model_temperatures

    async def event_gen():
        queue   = asyncio.Queue()
        tasks   = [
            asyncio.create_task(_stream_one_model(m, messages, _FakeReq(), i, queue))
            for i, m in enumerate(active)
        ]
        results  = [None] * len(active)
        finished = 0
        total    = len(active)

        while finished < total:
            try:
                evt_json = await asyncio.wait_for(queue.get(), timeout=120.0)
                yield f"data: {evt_json}\n\n"
                evt = json.loads(evt_json)
                if evt["type"] in ("done", "error"):
                    idx = evt["model_idx"]
                    m   = active[idx]
                    results[idx] = {
                        "model":     m["id"],
                        "name":      m.get("name", m["id"]),
                        "content":   evt.get("content", ""),
                        "error":     evt.get("error"),
                        "tokens":    evt.get("tokens", 0),
                        "elapsed_s": evt.get("elapsed_s"),
                    }
                    finished += 1
            except asyncio.TimeoutError:
                break

        entry = {
            "id":        str(time.time()),
            "timestamp": time.time(),
            "mode":      mode,
            "prompt":    req.prompt[:500],
            "results":   [r or {"model":"","name":"","content":"","error":"timeout","tokens":0,"elapsed_s":None} for r in results],
        }
        _compare_store.appendleft(entry)
        _save_history()
        settings.record_last_request("multi", mode=mode)
        yield f"data: {json.dumps({'type': 'complete', 'entry': entry})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/api/discovery/ollama", tags=["Discovery"], summary="Ollama model catalog",
    description="Returns a curated catalog of 21 Ollama models organized by size (tiny/small/medium/large). "
    "Each entry includes `installed` (already pulled) and `fits_ram` (enough free memory) flags.")
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


@router.get("/api/discovery/openrouter", tags=["Discovery"], summary="OpenRouter models",
    description="Fetches available models from OpenRouter's public API. Results are cached for 5 minutes. "
    "Free models are listed first. Returns: id, name, description, context_length, is_free, prompt_cost.")
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


@router.post("/api/discovery/add", tags=["Discovery"], summary="Quick-add model",
    description="Add a discovered model (Ollama or OpenRouter) to your Airvo configuration. "
    "The model is added as inactive — enable it in the dashboard or via PATCH /api/models/{id}/toggle.")
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
