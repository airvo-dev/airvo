from __future__ import annotations


def evaluate_slo(ops: dict, slo_cfg: dict) -> list[dict]:
    failures: list[dict] = []
    min_requests = int((slo_cfg.get("global") or {}).get("min_requests", 1))
    endpoint_cfg = slo_cfg.get("endpoints") or {}
    endpoints = ops.get("endpoints") or {}

    for endpoint, cfg in endpoint_cfg.items():
        item = endpoints.get(endpoint)
        if not isinstance(item, dict):
            failures.append({
                "endpoint": endpoint,
                "reason": "missing_endpoint_metrics",
                "message": "Endpoint not present in ops snapshot",
            })
            continue

        requests = int(item.get("requests", 0))
        if requests < min_requests:
            failures.append({
                "endpoint": endpoint,
                "reason": "insufficient_samples",
                "message": f"Expected >= {min_requests} requests, found {requests}",
            })
            continue

        err_rate = float(item.get("error_rate", 0.0))
        lat = item.get("latency_ms") or {}
        p95 = float(lat.get("p95", 0.0))
        p99 = float(lat.get("p99", 0.0))

        max_error_rate = float(cfg.get("max_error_rate", 1.0))
        max_p95_ms = float(cfg.get("max_p95_ms", 1e12))
        max_p99_ms = float(cfg.get("max_p99_ms", 1e12))

        if err_rate > max_error_rate:
            failures.append({
                "endpoint": endpoint,
                "reason": "error_rate_exceeded",
                "actual": round(err_rate, 4),
                "threshold": max_error_rate,
                "message": f"error_rate {err_rate:.4f} > {max_error_rate:.4f}",
            })

        if p95 > max_p95_ms:
            failures.append({
                "endpoint": endpoint,
                "reason": "p95_exceeded",
                "actual": round(p95, 2),
                "threshold": max_p95_ms,
                "message": f"p95 {p95:.2f}ms > {max_p95_ms:.2f}ms",
            })

        if p99 > max_p99_ms:
            failures.append({
                "endpoint": endpoint,
                "reason": "p99_exceeded",
                "actual": round(p99, 2),
                "threshold": max_p99_ms,
                "message": f"p99 {p99:.2f}ms > {max_p99_ms:.2f}ms",
            })

    return failures
