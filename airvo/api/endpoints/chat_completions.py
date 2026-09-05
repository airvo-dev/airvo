import json
import logging
import time
from typing import List, Optional

import litellm
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from airvo.api.common import get_request_id, log_event
from airvo.cache import prompt_cache as _cache
from airvo.confidence.scorer import score_dict as _confidence_score
from airvo.config.settings import settings
from airvo.context.optimizer import optimize as _optimize_context
from airvo.cost.pricing import estimate_cost_from_total, format_cost, get_monthly_cost, get_savings_vs_gpt4o, record_cost
from airvo.history import store as _history
from airvo.privacy.detector import has_high_severity, scan_messages, severity
from airvo.api.endpoints.compare import record_compare_entry
from airvo.api.services.limits import PROVIDER_LIMITS, msg_char_cap, provider, safe_max_tokens
from airvo.api.services.modes import parallel_mode, race_mode, review_mode, vote_mode

logger = logging.getLogger(__name__)
router = APIRouter()


class Message(BaseModel):
    role: str
    content: Optional[str] = None
    tool_calls: Optional[List] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None


class ChatRequest(BaseModel):
    model: Optional[str] = "airvo-auto"
    messages: List[Message]
    stream: Optional[bool] = True
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    tools: Optional[List] = None
    tool_choice: Optional[str | dict] = None


async def single_model_stream(response, model_id: str, messages: list = None, request_id: str = "", route_mode: str = "single"):
    total_tokens = 0
    full_text = []
    t0 = time.time()
    async for chunk in response:
        if hasattr(chunk, "usage") and chunk.usage:
            total_tokens = chunk.usage.total_tokens or 0
        try:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                full_text.append(delta)
        except Exception:
            pass
        yield f"data: {json.dumps(chunk.model_dump())}\\n\\n"

    elapsed = round(time.time() - t0, 2)
    if total_tokens > 0:
        settings.record_usage(model_id, total_tokens, elapsed_s=elapsed)

    cost_usd = estimate_cost_from_total(model_id, total_tokens)
    savings = get_savings_vs_gpt4o(model_id, total_tokens)
    record_cost(model_id, cost_usd)
    cost_event = {
        "type": "airvo_cost",
        "model": model_id,
        "tokens": total_tokens,
        "cost_usd": cost_usd,
        "cost_fmt": format_cost(cost_usd),
        "savings_usd": savings,
        "elapsed_s": elapsed,
    }
    yield f"data: {json.dumps(cost_event)}\\n\\n"

    response_text = "".join(full_text)
    conf = _confidence_score(response_text)
    yield f"data: {json.dumps({'type': 'airvo_confidence', 'model': model_id, **conf})}\\n\\n"

    if messages:
        _history.record(
            messages=messages,
            model_id=model_id,
            mode="single",
            response=response_text,
            tokens=total_tokens,
            cost_usd=cost_usd,
            elapsed_s=elapsed,
        )
        _cache.put(model_id, messages, response_text, tokens=total_tokens, cost_usd=cost_usd)

    log_event(
        logger,
        "chat_completion_stream_completed",
        request_id=request_id,
        mode=route_mode,
        model_id=model_id,
        tokens=total_tokens,
        cost_usd=cost_usd,
        elapsed_s=elapsed,
    )

    yield "data: [DONE]\\n\\n"


async def multi_model_stream(results, messages: list = None, request_id: str = "", route_mode: str = "multi"):
    combined = ""
    total_cost = 0.0
    total_tokens = 0

    for result in results:
        if result["error"]:
            combined += f"**{result['name']}:**\\n[error] {result['error']}\\n\\n---\\n\\n"
        else:
            combined += f"**{result['name']}:**\\n{result['content']}\\n\\n---\\n\\n"
        total_cost += result.get("cost_usd", 0.0)
        total_tokens += result.get("tokens", 0)
        record_cost(result["model"], result.get("cost_usd", 0.0))

    chunk_size = 10
    for i in range(0, len(combined), chunk_size):
        chunk = {
            "id": "airvo-multi",
            "object": "chat.completion.chunk",
            "model": "airvo-auto",
            "choices": [
                {
                    "index": 0,
                    "delta": {"content": combined[i:i + chunk_size]},
                    "finish_reason": None,
                }
            ],
        }
        yield f"data: {json.dumps(chunk)}\\n\\n"

    stop_chunk = {
        "id": "airvo-multi",
        "object": "chat.completion.chunk",
        "model": "airvo-auto",
        "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
    }
    yield f"data: {json.dumps(stop_chunk)}\\n\\n"

    cost_event = {
        "type": "airvo_cost",
        "model": "airvo-multi",
        "tokens": total_tokens,
        "cost_usd": round(total_cost, 8),
        "cost_fmt": format_cost(total_cost),
        "per_model": [
            {
                "model": r["model"],
                "name": r["name"],
                "cost_usd": r.get("cost_usd", 0.0),
                "cost_fmt": r.get("cost_fmt", "free"),
                "tokens": r.get("tokens", 0),
            }
            for r in results
        ],
    }
    yield f"data: {json.dumps(cost_event)}\\n\\n"

    for result in results:
        if result.get("content"):
            conf = _confidence_score(result["content"])
            yield f"data: {json.dumps({'type': 'airvo_confidence', 'model': result['model'], **conf})}\\n\\n"

    if messages:
        primary = next((r for r in results if not r.get("error")), results[0])
        _history.record(
            messages=messages,
            model_id=primary["model"],
            mode="multi",
            response=combined,
            tokens=total_tokens,
            cost_usd=round(total_cost, 8),
            elapsed_s=primary.get("elapsed_s") or 0.0,
        )

    log_event(
        logger,
        "chat_completion_stream_completed",
        request_id=request_id,
        mode=route_mode,
        model_id="airvo-multi",
        tokens=total_tokens,
        cost_usd=round(total_cost, 8),
        elapsed_s=max((r.get("elapsed_s") or 0.0) for r in results) if results else 0.0,
        active_models=len(results),
        errors_total=sum(1 for r in results if r.get("error")),
    )

    yield "data: [DONE]\\n\\n"


@router.post("/v1/chat/completions", tags=["Chat"], summary="Chat completion (streaming)",
    description="OpenAI-compatible chat completion endpoint with SSE streaming.")
async def chat_completions(request: ChatRequest, http_request: Request):
    request_id = get_request_id(http_request)
    try:
        active_models = settings.get_active_models()
        log_event(
            logger,
            "chat_completion_received",
            request_id=request_id,
            stream=bool(request.stream),
            message_count=len(request.messages),
            active_models=len(active_models),
            has_tools=bool(request.tools),
        )
        active_providers = {provider(m["id"]) for m in active_models}
        lowest_cap = None
        for provider_id in active_providers:
            cap = PROVIDER_LIMITS.get(provider_id, {}).get("max_output")
            if cap and (lowest_cap is None or cap < lowest_cap):
                lowest_cap = cap
        if lowest_cap and request.max_tokens and request.max_tokens > lowest_cap:
            logger.warning("[TPM-GUARD] request.max_tokens %d -> capped to %d", request.max_tokens, lowest_cap)
            request.max_tokens = lowest_cap
        elif lowest_cap and not request.max_tokens:
            request.max_tokens = lowest_cap
            logger.warning("[TPM-GUARD] request.max_tokens was None -> set to %d", lowest_cap)

        messages = []
        for msg in request.messages:
            packed = {"role": msg.role}
            if msg.content is not None:
                packed["content"] = msg.content
            if msg.tool_calls is not None:
                packed["tool_calls"] = msg.tool_calls
            if msg.tool_call_id is not None:
                packed["tool_call_id"] = msg.tool_call_id
            if msg.name is not None:
                packed["name"] = msg.name
            messages.append(packed)

        system_content = settings.system_prompt
        memory = settings.get_memory_prompt()
        if memory:
            system_content += f"\\n\\n## Project Context\\n{memory}"

        prefs = settings.get_prefs()
        if prefs.get("rag_enabled") and prefs.get("rag_path", "").strip():
            try:
                from airvo.rag.retriever import format_context, retrieve
                last_user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), None)
                if last_user_msg:
                    top_k = int(prefs.get("rag_top_k", 5))
                    chunks = retrieve(last_user_msg, top_k=top_k)
                    context = format_context(chunks)
                    if context:
                        max_rag_chars = int(prefs.get("rag_max_inject_chars", 1500))
                        if len(context) > max_rag_chars:
                            context = context[:max_rag_chars] + "\\n... [RAG context truncated]"
                        system_content += f"\\n\\n{context}"
            except Exception as rag_exc:
                logger.warning("[RAG] context injection failed: %s", rag_exc)

        if not any(m["role"] == "system" for m in messages):
            messages.insert(0, {"role": "system", "content": system_content})

        active_now = settings.get_active_models()
        primary_id = active_now[0]["id"] if active_now else ""
        max_history = int(prefs.get("max_history_messages", 10))

        if primary_id:
            messages, _ = _optimize_context(messages, primary_id, max_history_cap=max_history)
            system_msgs = [m for m in messages if m["role"] == "system"]
            other_msgs = [m for m in messages if m["role"] != "system"]
        else:
            system_msgs = [m for m in messages if m["role"] == "system"]
            other_msgs = [m for m in messages if m["role"] != "system"]
            if len(other_msgs) > max_history:
                other_msgs = other_msgs[-max_history:]

        char_cap = msg_char_cap(settings.get_active_models())
        if char_cap:
            trimmed = []
            for msg in other_msgs:
                content = msg.get("content") or ""
                if isinstance(content, str) and len(content) > char_cap:
                    msg = dict(msg)
                    msg["content"] = content[:char_cap] + " ... [trimmed]"
                trimmed.append(msg)
            other_msgs = trimmed

        messages = system_msgs + other_msgs
        active = settings.get_active_models()

        if not active:
            log_event(
                logger,
                "chat_completion_rejected",
                request_id=request_id,
                reason="no_active_models",
            )
            raise HTTPException(status_code=400, detail="No active models. Configure at least one in the dashboard.")

        if prefs.get("privacy_mode_enabled", False):
            user_messages = [m for m in messages if m.get("role") == "user"]
            privacy_hits = scan_messages(user_messages)
            if privacy_hits and has_high_severity(privacy_hits):
                local_models = [
                    m for m in active
                    if m.get("provider") in ("ollama", "lmstudio") or "localhost" in (m.get("base_url") or "")
                ]
                if local_models:
                    logger.warning("[Privacy] HIGH severity secrets detected - forcing local model '%s'", local_models[0]["id"])
                    active = local_models[:1]
                else:
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "privacy_blocked": True,
                            "message": "Privacy Mode: sensitive data detected and no local model is available. Add an Ollama model or disable Privacy Mode.",
                            "findings": [{"kind": h.kind, "severity": severity(h), "redacted": h.redacted} for h in privacy_hits],
                        },
                    )

        budget_usd = float(prefs.get("cost_budget_usd", 0.0))
        if budget_usd > 0:
            from datetime import date as _date
            month_key = _date.today().strftime("%Y-%m")
            monthly = get_monthly_cost(month_key)
            spent = sum(monthly.values())
            if spent >= budget_usd:
                free_models = [
                    m for m in active
                    if m.get("free") or m.get("provider") in ("ollama", "lmstudio", "groq", "cerebras")
                ]
                if free_models:
                    logger.warning("[Budget] Monthly limit $%.4f exceeded (spent $%.4f) - restricting to free models", budget_usd, spent)
                    active = free_models
                else:
                    raise HTTPException(
                        status_code=402,
                        detail={
                            "budget_exceeded": True,
                            "message": f"Monthly cost budget of ${budget_usd:.2f} exceeded (spent ${spent:.4f}). Add a free/local model or raise your budget.",
                            "spent_usd": round(spent, 4),
                            "budget_usd": budget_usd,
                        },
                    )

        if request.tools:
            agent_model_id = prefs.get("agent_model", "")
            model_cfg = next((x for x in active if x["id"] == agent_model_id), active[0])
            raw_max = request.max_tokens or prefs.get("max_tokens", settings.max_tokens)
            kwargs = dict(
                model=model_cfg["id"],
                messages=messages,
                max_tokens=safe_max_tokens(model_cfg["id"], raw_max),
                temperature=request.temperature or prefs.get("temperature", settings.temperature),
                stream=True,
                api_key=model_cfg.get("api_key"),
                tools=request.tools,
            )
            if request.tool_choice is not None:
                kwargs["tool_choice"] = request.tool_choice
            if model_cfg.get("base_url"):
                kwargs["api_base"] = model_cfg["base_url"]

            response = await litellm.acompletion(**kwargs)
            settings.record_last_request("tool_call", model=model_cfg.get("name", model_cfg["id"]))
            log_event(
                logger,
                "chat_completion_dispatched",
                request_id=request_id,
                mode="tool_call",
                model_id=model_cfg["id"],
            )
            return StreamingResponse(
                single_model_stream(response, model_cfg["id"], request_id=request_id, route_mode="tool_call"),
                media_type="text/event-stream",
            )

        if len(active) == 1:
            model_cfg = active[0]
            raw_max = request.max_tokens or prefs.get("max_tokens", settings.max_tokens)
            kwargs = dict(
                model=model_cfg["id"],
                messages=messages,
                max_tokens=safe_max_tokens(model_cfg["id"], raw_max),
                temperature=request.temperature or prefs.get("temperature", settings.temperature),
                stream=True,
                api_key=model_cfg.get("api_key"),
            )
            if model_cfg.get("base_url"):
                kwargs["api_base"] = model_cfg["base_url"]

            response = await litellm.acompletion(**kwargs)
            settings.record_last_request("single", model=model_cfg.get("name", model_cfg["id"]))
            log_event(
                logger,
                "chat_completion_dispatched",
                request_id=request_id,
                mode="single",
                model_id=model_cfg["id"],
            )
            return StreamingResponse(
                single_model_stream(response, model_cfg["id"], messages, request_id=request_id, route_mode="single"),
                media_type="text/event-stream",
            )

        mode = prefs.get("mode", "parallel")
        if mode == "race":
            results = await race_mode(active, messages, request)
        elif mode == "vote":
            results = await vote_mode(active, messages, request)
        elif mode == "review":
            results = await review_mode(active, messages, request)
        else:
            results = await parallel_mode(active, messages, request)

        last_prompt = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user" and isinstance(m.get("content"), str)),
            "",
        )
        record_compare_entry(
            {
                "id": str(time.time()),
                "timestamp": time.time(),
                "mode": mode,
                "prompt": last_prompt[:500],
                "results": [
                    {
                        "model": r["model"],
                        "name": r["name"],
                        "content": r["content"],
                        "error": r["error"],
                        "tokens": r["tokens"],
                        "elapsed_s": r.get("elapsed_s"),
                    }
                    for r in results
                ],
            }
        )

        settings.record_last_request("multi", mode=mode)
        log_event(
            logger,
            "chat_completion_dispatched",
            request_id=request_id,
            mode=mode,
            model_id="airvo-multi",
            active_models=len(active),
        )
        return StreamingResponse(
            multi_model_stream(results, messages, request_id=request_id, route_mode=mode),
            media_type="text/event-stream",
        )

    except HTTPException as exc:
        log_event(
            logger,
            "chat_completion_failed",
            request_id=request_id,
            status_code=exc.status_code,
        )
        raise
    except Exception as e:
        log_event(
            logger,
            "chat_completion_failed",
            request_id=request_id,
            status_code=500,
            error=str(e),
        )
        raise HTTPException(status_code=500, detail=str(e))
