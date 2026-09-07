import json
import logging
import os
import time
from typing import Optional

import litellm
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from airvo.api.common import get_request_id, log_event, sse_error_event
from airvo.config.settings import MEMORY_MAX_CHARS, settings
from airvo.router.classifier import classify as _classify_prompt
from airvo.api.services.limits import safe_max_tokens
from airvo.storage import JsonFileStore

logger = logging.getLogger(__name__)
router = APIRouter()

_CHAT_HISTORY_FILE = os.path.join(os.path.expanduser("~"), ".airvo", "chat_history.json")
_MAX_CONVERSATIONS = 50
_DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "docs")
_chat_store = JsonFileStore(_CHAT_HISTORY_FILE, default_factory=list)


def _load_airvo_system_prompt() -> str:
    parts = [
        "You are the Airvo Assistant - an embedded expert guide for the Airvo tool.",
        "IMPORTANT RULES:",
        "1. ONLY answer questions about Airvo, its features, configuration, and usage.",
        "2. If asked about general Python, AI, or unrelated topics, redirect: 'I'm the Airvo Assistant - I can only help with Airvo-specific questions.'",
        "3. Always give PRACTICAL, SPECIFIC answers about Airvo - not generic AI/ML theory.",
        "4. When explaining RAG, always explain it in the context of how Airvo uses it (indexing the project, injecting context into requests to continue.dev).",
        "5. When explaining models, refer to the Airvo dashboard and configuration flow.",
        "6. Be concise. Prefer step-by-step instructions over long explanations.",
        "7. ALWAYS respond in the same language the user writes in. If they write in Spanish, answer in Spanish. If English, answer in English.",
        "",
        "AIRVO CONTEXT SUMMARY:",
        "- Airvo is a local server (default port 5000) that acts as an OpenAI-compatible proxy.",
        "- Users connect continue.dev (or any OpenAI-compatible client) to Airvo instead of directly to the model provider.",
        "- Airvo routes requests to the configured models (Groq, OpenAI, Ollama, LMStudio, etc.).",
        "- RAG: Airvo indexes the user's project files locally (ChromaDB, ~/.airvo/rag/) and injects relevant code fragments into every request automatically.",
        "- Compare tab: sends the same prompt to multiple models simultaneously and shows results side by side.",
        "- Smart Memory: project-level context (description, tech stack) always injected into requests.",
        "- The Airvo dashboard is accessible at http://localhost:5000 (or the port configured with --port).",
        "- continue.dev config: set apiBase to http://localhost:5000/v1 and model to 'airvo'.",
        "",
    ]
    for fname in ("HELP.md", "ARCHITECTURE.md"):
        fpath = os.path.normpath(os.path.join(_DOCS_DIR, fname))
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
            parts.append(f"--- {fname} ---\\n{content[:8000]}")
        except Exception:
            pass
    return "\\n".join(parts)


def _load_chat_history() -> list:
    data = _chat_store.load()
    return data if isinstance(data, list) else []


def _save_chat_history(data: list) -> None:
    try:
        _chat_store.save(data)
    except Exception as exc:
        logger.warning("[Chat] Failed to save chat history: %s", exc)


class ChatSendRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    model_id: Optional[str] = None


@router.get("/api/chat/history", tags=["Chat History"])
async def get_chat_history():
    convs = _load_chat_history()
    return {"conversations": convs}


@router.delete("/api/chat/history/{conv_id}", tags=["Chat History"])
async def delete_conversation(conv_id: str):
    convs = _load_chat_history()
    convs = [c for c in convs if c.get("id") != conv_id]
    _save_chat_history(convs)
    return {"ok": True}


@router.delete("/api/chat/history", tags=["Chat History"])
async def clear_chat_history():
    _save_chat_history([])
    return {"ok": True}


@router.patch("/api/chat/history/{conv_id}/title", tags=["Chat History"])
async def rename_conversation(conv_id: str, body: dict):
    convs = _load_chat_history()
    for c in convs:
        if c.get("id") == conv_id:
            c["title"] = body.get("title", c["title"])
            break
    _save_chat_history(convs)
    return {"ok": True}


@router.post("/api/chat/stream", tags=["Chat History"])
async def chat_stream(req: ChatSendRequest, request: Request):
    request_id = get_request_id(request)
    prefs = settings.get_prefs()
    active_mods = settings.get_active_models()

    route_category = _classify_prompt(req.message)
    chosen = None
    if req.model_id:
        chosen = next((m for m in active_mods if m["id"] == req.model_id), None)

    if not chosen:
        router_pref_key = f"router_{route_category}"
        router_model_id = prefs.get(router_pref_key)
        if router_model_id:
            chosen = next((m for m in active_mods if m["id"] == router_model_id), None)

    if not chosen and prefs.get("agent_model"):
        chosen = next((m for m in active_mods if m["id"] == prefs["agent_model"]), None)

    if not chosen and active_mods:
        try:
            from airvo.free_route.manager import get_best_for_category
            best_free_id = get_best_for_category(route_category)
            if best_free_id:
                litellm_id = best_free_id[len("openrouter/"):] if best_free_id.startswith("openrouter/") else best_free_id
                chosen = next((m for m in active_mods if m["id"] == litellm_id), None)
        except Exception:
            pass

    if not chosen and active_mods:
        try:
            from airvo.ratings.store import get_model_scores
            scores = get_model_scores()
            if scores:
                chosen = max(active_mods, key=lambda m: scores.get(m["id"], 0.5))
        except Exception:
            pass

    if not chosen and active_mods:
        chosen = active_mods[0]

    if not chosen:
        log_event(
            logger,
            "chat_history_stream_rejected",
            request_id=request_id,
            reason="no_active_model",
            route_category=route_category,
        )
        async def _no_model():
            evt = json.dumps(
                sse_error_event(
                    message="No active model configured",
                    request_id=request_id,
                    code="NO_ACTIVE_MODEL",
                )
            )
            yield f"data: {evt}\\n\\n"
        return StreamingResponse(_no_model(), media_type="text/event-stream")

    convs = _load_chat_history()
    conv_id = req.conversation_id

    if conv_id:
        conv = next((c for c in convs if c.get("id") == conv_id), None)
        if not conv:
            conv_id = None

    if not conv_id:
        import uuid
        conv_id = str(uuid.uuid4())
        title = req.message[:60] + ("..." if len(req.message) > 60 else "")
        conv = {
            "id": conv_id,
            "title": title,
            "created_at": time.time(),
            "model": chosen["id"],
            "model_name": chosen.get("name", chosen["id"]),
            "messages": [],
        }
        convs.insert(0, conv)
        if len(convs) > _MAX_CONVERSATIONS:
            convs = convs[:_MAX_CONVERSATIONS]

    conv["messages"].append({"role": "user", "content": req.message})

    llm_messages = []
    live_status_lines = ["\\nCURRENT USER STATE (live snapshot):"]
    live_status_lines.append(f"  Active models ({len(active_mods)}):")
    for m in active_mods:
        live_status_lines.append(f"    - {m.get('name', m['id'])} [{m['id']}] provider={m.get('provider', '?')}")
    if not active_mods:
        live_status_lines.append("    (none - user has no active models)")
    live_status_lines.append(f"  RAG enabled: {prefs.get('rag_enabled', False)}")
    live_status_lines.append(f"  Memory enabled: {prefs.get('memory_enabled', False)}")
    live_status_lines.append(f"  max_history_messages: {prefs.get('max_history_messages', 10)}")
    system_parts = [_load_airvo_system_prompt() + "\\n".join(live_status_lines)]
    if prefs.get("memory_enabled") and prefs.get("memory_text", "").strip():
        system_parts.append(prefs["memory_text"].strip()[:MEMORY_MAX_CHARS])
    llm_messages.append({"role": "system", "content": "\\n\\n".join(system_parts)})

    max_hist = int(prefs.get("max_history_messages", 10))
    llm_messages.extend([
        {"role": m["role"], "content": m["content"]}
        for m in conv["messages"][-max_hist:]
    ])

    temperature = float(prefs.get("temperature", 0.7))
    fallback_chain = [chosen] + [m for m in active_mods if m["id"] != chosen["id"]]

    async def _stream():
        full_response = ""
        start = time.time()
        token_count = 0
        used_model = chosen

        for attempt, candidate in enumerate(fallback_chain):
            cand_id = candidate["id"]
            cand_tokens = safe_max_tokens(cand_id, int(prefs.get("max_tokens", 1024)))
            full_response = ""
            token_count = 0

            if attempt > 0:
                fallback_evt = json.dumps({
                    "type": "fallback",
                    "from": fallback_chain[attempt - 1].get("name", fallback_chain[attempt - 1]["id"]),
                    "to": candidate.get("name", cand_id),
                })
                yield f"data: {fallback_evt}\\n\\n"

            try:
                kwargs = dict(
                    model=cand_id,
                    messages=llm_messages,
                    stream=True,
                    max_tokens=cand_tokens,
                    temperature=temperature,
                )
                if candidate.get("api_key"):
                    kwargs["api_key"] = candidate["api_key"]
                if candidate.get("base_url"):
                    kwargs["base_url"] = candidate["base_url"]

                resp = await litellm.acompletion(**kwargs)
                async for chunk in resp:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        full_response += delta
                        token_count += 1
                        payload = json.dumps({"type": "delta", "content": delta}, ensure_ascii=False)
                        yield f"data: {payload}\\n\\n"

                used_model = candidate
                break

            except Exception as exc:
                logger.warning("[Fallback] Model %s failed (attempt %d/%d): %s", cand_id, attempt + 1, len(fallback_chain), exc)
                if attempt == len(fallback_chain) - 1:
                    log_event(
                        logger,
                        "chat_history_stream_failed",
                        request_id=request_id,
                        route_category=route_category,
                        attempted_models=len(fallback_chain),
                    )
                    err = json.dumps(
                        sse_error_event(
                            message="All models failed. Please review provider connectivity and retry.",
                            request_id=request_id,
                            code="ALL_MODELS_FAILED",
                        )
                    )
                    yield f"data: {err}\\n\\n"
                    return

        elapsed = round(time.time() - start, 2)
        model_id = used_model["id"]

        conv["messages"].append({"role": "assistant", "content": full_response})
        conv["updated_at"] = time.time()
        _save_chat_history(convs)

        try:
            settings.record_usage(model_id, token_count)
        except Exception:
            pass

        try:
            from airvo.cost.pricing import estimate_cost_from_total, format_cost, get_savings_vs_gpt4o, record_cost
            cost_usd = estimate_cost_from_total(model_id, token_count)
            savings = get_savings_vs_gpt4o(model_id, token_count)
            record_cost(model_id, cost_usd)
            cost_event = json.dumps({
                "type": "airvo_cost",
                "model": model_id,
                "tokens": token_count,
                "cost_usd": cost_usd,
                "cost_fmt": format_cost(cost_usd),
                "savings_usd": savings,
                "elapsed_s": elapsed,
            })
            yield f"data: {cost_event}\\n\\n"
        except Exception:
            pass

        try:
            from airvo.confidence.scorer import score_dict as _confidence_score
            conf = _confidence_score(full_response)
            yield f"data: {json.dumps({'type': 'airvo_confidence', 'model': model_id, **conf})}\\n\\n"
        except Exception:
            pass

        done = json.dumps({
            "type": "done",
            "tokens": token_count,
            "elapsed_s": elapsed,
            "conv_id": conv_id,
            "title": conv["title"],
            "model_id": model_id,
            "model_name": used_model.get("name", model_id),
            "route_category": route_category,
        })
        yield f"data: {done}\\n\\n"
        log_event(
            logger,
            "chat_history_stream_completed",
            request_id=request_id,
            model_id=model_id,
            route_category=route_category,
            tokens=token_count,
            elapsed_s=elapsed,
        )

    return StreamingResponse(_stream(), media_type="text/event-stream")
