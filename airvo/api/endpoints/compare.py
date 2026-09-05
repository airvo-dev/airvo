import asyncio
import json
import logging
import os
import time
from collections import deque
from typing import Optional

import litellm
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from airvo.api.common import get_request_id, log_event, sse_error_event
from airvo.config.settings import settings
from airvo.api.services.limits import safe_max_tokens
from airvo.api.services.modes import parallel_mode, race_mode, review_mode, vote_mode
from airvo.storage import JsonFileStore

logger = logging.getLogger(__name__)
router = APIRouter()

_HISTORY_FILE = os.path.join(os.path.expanduser("~"), ".airvo", "compare_history.json")
_history_store = JsonFileStore(_HISTORY_FILE, default_factory=list)


def _load_history() -> deque:
    data = _history_store.load()
    if isinstance(data, list):
        return deque(data, maxlen=10)
    return deque(maxlen=10)


_compare_store: deque = _load_history()


def _save_history() -> None:
    try:
        _history_store.save(list(_compare_store))
    except Exception as exc:
        logger.warning("[Compare] Failed to save history: %s", exc)


def record_compare_entry(entry: dict) -> None:
    _compare_store.appendleft(entry)
    _save_history()


class CompareRunRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    model_temperatures: Optional[dict] = None


@router.get("/api/compare/latest", tags=["Compare"], summary="Last multi-model comparison",
    description="Returns the most recent multi-model response data for side-by-side comparison in the Airvo dashboard. Updated automatically after every multi-model chat completion.")
async def compare_latest():
    if not _compare_store:
        return {"data": None}
    return {"data": _compare_store[0]}


@router.get("/api/compare/history", tags=["Compare"], summary="Compare history (last 10)",
    description="Returns the last 10 multi-model comparisons in reverse chronological order.")
async def compare_history():
    return {"history": list(_compare_store)}


@router.delete("/api/compare/history", tags=["Compare"], summary="Clear compare history",
    description="Clears all compare history entries from memory and from disk.")
async def compare_clear_history():
    _compare_store.clear()
    _save_history()
    return {"ok": True}


@router.post("/api/compare/run", tags=["Compare"], summary="Run a comparison from the dashboard",
    description="Send a prompt directly from the Compare tab. All active models respond in parallel (or the configured mode). Result is saved to compare history and returned immediately.")
async def compare_run(req: CompareRunRequest):
    try:
        active = settings.get_active_models()
        if len(active) < 2:
            log_event(
                logger,
                "compare_run_rejected",
                reason="insufficient_active_models",
                active_models=len(active),
            )
            raise HTTPException(status_code=400, detail="Need at least 2 active models to compare.")

        prefs = settings.get_prefs()
        messages = [
            {"role": "system", "content": settings.system_prompt},
            {"role": "user", "content": req.prompt},
        ]

        class _FakeReq:
            max_tokens = req.max_tokens
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
            "id": str(time.time()),
            "timestamp": time.time(),
            "mode": mode,
            "prompt": req.prompt[:500],
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
        record_compare_entry(entry)
        settings.record_last_request("multi", mode=mode)
        log_event(
            logger,
            "compare_run_completed",
            mode=mode,
            active_models=len(active),
            tokens_total=sum((r.get("tokens") or 0) for r in results),
            errors_total=sum(1 for r in results if r.get("error")),
        )
        return {"data": entry}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _stream_one_model(model_cfg: dict, messages: list, req_obj, idx: int, queue: asyncio.Queue, request_id: str):
    t0 = time.time()
    content = ""
    tokens = 0
    try:
        prefs = settings.get_prefs()
        raw_max = req_obj.max_tokens or prefs.get("max_tokens", settings.max_tokens)
        model_temps = getattr(req_obj, "model_temperatures", None) or {}
        temp = model_temps.get(model_cfg["id"])
        kwargs = dict(
            model=model_cfg["id"],
            messages=messages,
            max_tokens=safe_max_tokens(model_cfg["id"], raw_max),
            temperature=temp if temp is not None else (req_obj.temperature or prefs.get("temperature", settings.temperature)),
            stream=True,
            api_key=model_cfg.get("api_key"),
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
        await queue.put(
            json.dumps(
                sse_error_event(
                    message=str(e),
                    request_id=request_id,
                    code="MODEL_STREAM_ERROR",
                    model_idx=idx,
                    content=content,
                )
            )
        )


@router.post("/api/compare/stream", tags=["Compare"],
    summary="Streaming comparison (SSE)",
    description="Like /api/compare/run but streams each model's tokens in real time via SSE. Events: start | delta | done | error | complete.")
async def compare_stream_run(req: CompareRunRequest, request: Request):
    request_id = get_request_id(request)
    active = settings.get_active_models()
    if len(active) < 2:
        log_event(
            logger,
            "compare_stream_rejected",
            request_id=request_id,
            reason="insufficient_active_models",
            active_models=len(active),
        )
        raise HTTPException(status_code=400, detail="Need at least 2 active models.")
    prefs = settings.get_prefs()
    mode = prefs.get("mode", "parallel")
    messages = [
        {"role": "system", "content": settings.system_prompt},
        {"role": "user", "content": req.prompt},
    ]

    class _FakeReq:
        max_tokens = req.max_tokens
        temperature = req.temperature
        model_temperatures = req.model_temperatures

    async def event_gen(request_id: str):
        queue = asyncio.Queue()
        tasks = [
            asyncio.create_task(_stream_one_model(m, messages, _FakeReq(), i, queue, request_id))
            for i, m in enumerate(active)
        ]
        results = [None] * len(active)
        finished = 0
        total = len(active)

        while finished < total:
            try:
                evt_json = await asyncio.wait_for(queue.get(), timeout=120.0)
                yield f"data: {evt_json}\\n\\n"
                evt = json.loads(evt_json)
                if evt["type"] in ("done", "error"):
                    idx = evt["model_idx"]
                    m = active[idx]
                    results[idx] = {
                        "model": m["id"],
                        "name": m.get("name", m["id"]),
                        "content": evt.get("content", ""),
                        "error": evt.get("error"),
                        "tokens": evt.get("tokens", 0),
                        "elapsed_s": evt.get("elapsed_s"),
                    }
                    finished += 1
            except asyncio.TimeoutError:
                break

        for task in tasks:
            if not task.done():
                task.cancel()

        entry = {
            "id": str(time.time()),
            "timestamp": time.time(),
            "mode": mode,
            "prompt": req.prompt[:500],
            "results": [r or {"model": "", "name": "", "content": "", "error": "timeout", "tokens": 0, "elapsed_s": None} for r in results],
        }
        record_compare_entry(entry)
        settings.record_last_request("multi", mode=mode)
        log_event(
            logger,
            "compare_stream_completed",
            request_id=request_id,
            mode=mode,
            active_models=len(active),
            completed_models=sum(1 for r in results if r),
            errors_total=sum(1 for r in results if r and r.get("error")),
        )
        yield f"data: {json.dumps({'type': 'complete', 'entry': entry, 'request_id': request_id})}\\n\\n"

    return StreamingResponse(
        event_gen(request_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
