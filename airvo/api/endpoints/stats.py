from fastapi import APIRouter
from pydantic import BaseModel

from airvo.config.settings import settings
from airvo import server as server_module
from airvo.observability import set_ops_slo_state

router = APIRouter()


def _ops_alerts(ops: dict, prefs: dict) -> dict:
    err_warn = float(prefs.get("slo_error_rate_warn", 0.05))
    p95_warn = float(prefs.get("slo_p95_ms_warn", 1200))
    p99_warn = float(prefs.get("slo_p99_ms_warn", 2500))

    alerts = []
    for endpoint, item in (ops.get("endpoints") or {}).items():
        error_rate = float(item.get("error_rate", 0.0))
        latency = item.get("latency_ms") or {}
        p95 = float(latency.get("p95", 0.0))
        p99 = float(latency.get("p99", 0.0))

        if error_rate >= err_warn:
            alerts.append({
                "severity": "warn",
                "kind": "error_rate",
                "endpoint": endpoint,
                "value": round(error_rate, 4),
                "threshold": err_warn,
                "message": f"Error rate {error_rate:.2%} exceeds SLO threshold {err_warn:.2%}",
            })
        if p95 >= p95_warn:
            alerts.append({
                "severity": "warn",
                "kind": "latency_p95",
                "endpoint": endpoint,
                "value": p95,
                "threshold": p95_warn,
                "message": f"p95 latency {p95:.2f}ms exceeds SLO threshold {p95_warn:.2f}ms",
            })
        if p99 >= p99_warn:
            alerts.append({
                "severity": "warn",
                "kind": "latency_p99",
                "endpoint": endpoint,
                "value": p99,
                "threshold": p99_warn,
                "message": f"p99 latency {p99:.2f}ms exceeds SLO threshold {p99_warn:.2f}ms",
            })

    return {
        "ok": len(alerts) == 0,
        "thresholds": {
            "error_rate_warn": err_warn,
            "p95_ms_warn": p95_warn,
            "p99_ms_warn": p99_warn,
        },
        "alerts": alerts,
    }


@router.get("/api/stats", tags=["Stats"], summary="Get usage statistics",
    description="Returns per-model usage stats: `{model_id: {requests: N, tokens: N}}`. Persisted in `~/.airvo/stats.json`.")
async def get_stats():
    return {"stats": settings.get_stats()}


@router.delete("/api/stats", tags=["Stats"], summary="Reset statistics",
    description="Reset all usage statistics to zero for every model.")
async def reset_stats():
    settings.reset_stats()
    return {"ok": True}


@router.get("/api/stats/ops", tags=["Stats"], summary="Get operational metrics",
    description="Returns in-memory operational metrics per endpoint, including request/error counters and latency percentiles (p50/p95/p99).")
async def get_ops_stats():
    return {"ops": server_module._ops_metrics.snapshot()}


@router.delete("/api/stats/ops", tags=["Stats"], summary="Reset operational metrics",
    description="Resets in-memory operational metrics counters and latency samples.")
async def reset_ops_stats():
    server_module._ops_metrics.reset()
    return {"ok": True}


@router.get("/api/stats/ops/alerts", tags=["Stats"], summary="Get SLO alerts",
    description="Evaluates operational metrics against SLO warning thresholds from prefs and returns current alerts.")
async def get_ops_alerts():
    ops = server_module._ops_metrics.snapshot()
    prefs = settings.get_prefs()
    payload = _ops_alerts(ops, prefs)
    set_ops_slo_state(bool(payload.get("ok", False)))
    return {"slo": payload}


class CopyEventRequest(BaseModel):
    model_id: str


@router.post("/api/stats/copy", tags=["Stats"], summary="Record a copy event",
    description="Increment the copy counter for a model - used as a quality signal in the Stats tab.")
async def record_copy(req: CopyEventRequest):
    settings.record_copy(req.model_id)
    return {"ok": True}
