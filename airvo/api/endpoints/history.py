import time

import litellm
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from airvo.config.settings import settings
from airvo.history import store as _history
from airvo.cost.pricing import estimate_cost_from_response, format_cost, record_cost
from airvo.api.services.limits import safe_max_tokens

router = APIRouter()


@router.get("/api/history", tags=["History"],
    summary="List request history",
    description="Returns paginated request history. Supports search by prompt text or model id.")
def history_list(limit: int = 50, offset: int = 0, search: str = ""):
    return _history.list_entries(limit=limit, offset=offset, search=search)


@router.get("/api/history/{entry_id}", tags=["History"],
    summary="Get full detail of a history entry (including messages for replay)")
def history_get(entry_id: str):
    entry = _history.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    return entry


@router.delete("/api/history", tags=["History"], summary="Clear all request history")
def history_clear():
    count = _history.clear_history()
    return {"deleted": count}


class ReplayRequest(BaseModel):
    model_id: str


@router.post("/api/history/{entry_id}/replay", tags=["History"],
    summary="Counterfactual Replay - re-run a past prompt on a different model",
    description="Takes the original conversation messages from a history entry and sends them to the specified model. The result is stored as a replay inside the entry.")
async def history_replay(entry_id: str, body: ReplayRequest):
    entry = _history.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")

    all_models = settings.get_models()
    model_cfg = next((m for m in all_models if m["id"] == body.model_id), None)
    if not model_cfg:
        raise HTTPException(status_code=400, detail=f"Model '{body.model_id}' not found")

    messages = entry.get("messages", [])
    if not messages:
        raise HTTPException(status_code=400, detail="History entry has no messages to replay")

    prefs = settings.get_prefs()
    raw_max = prefs.get("max_tokens", settings.max_tokens)
    kwargs = dict(
        model=model_cfg["id"],
        messages=messages,
        max_tokens=safe_max_tokens(model_cfg["id"], raw_max),
        temperature=prefs.get("temperature", settings.temperature),
        stream=False,
        api_key=model_cfg.get("api_key"),
    )
    if model_cfg.get("base_url"):
        kwargs["api_base"] = model_cfg["base_url"]

    t0 = time.time()
    try:
        response = await litellm.acompletion(**kwargs)
        elapsed = round(time.time() - t0, 2)
        resp_text = response.choices[0].message.content or ""
        usage = response.usage
        tokens = usage.total_tokens if usage and usage.total_tokens else 0
        cost_usd = estimate_cost_from_response(model_cfg["id"], response)
        record_cost(model_cfg["id"], cost_usd)
        _history.record_replay(
            entry_id=entry_id,
            model_id=model_cfg["id"],
            response=resp_text,
            tokens=tokens,
            cost_usd=cost_usd,
            elapsed_s=elapsed,
        )
        return {
            "entry_id": entry_id,
            "model_id": model_cfg["id"],
            "response": resp_text,
            "tokens": tokens,
            "cost_usd": cost_usd,
            "cost_fmt": format_cost(cost_usd),
            "elapsed_s": elapsed,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Replay failed: {e}")
