from __future__ import annotations

import threading
from collections import defaultdict
from typing import Any


def _percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    idx = int(round((len(ordered) - 1) * p))
    idx = max(0, min(idx, len(ordered) - 1))
    return round(ordered[idx], 2)


class OpsMetricsCollector:
    """In-memory operational metrics per endpoint."""

    def __init__(self, max_samples_per_endpoint: int = 1000) -> None:
        self.max_samples_per_endpoint = max(50, int(max_samples_per_endpoint))
        self._lock = threading.RLock()
        self._data: dict[str, dict[str, Any]] = defaultdict(lambda: {
            "requests": 0,
            "errors": 0,
            "latency_ms": [],
        })

    def record(self, *, method: str, path: str, status_code: int, elapsed_ms: float) -> None:
        key = f"{method.upper()} {path}"
        with self._lock:
            bucket = self._data[key]
            bucket["requests"] += 1
            if status_code >= 400:
                bucket["errors"] += 1
            latencies = bucket["latency_ms"]
            latencies.append(round(float(elapsed_ms), 2))
            if len(latencies) > self.max_samples_per_endpoint:
                del latencies[: len(latencies) - self.max_samples_per_endpoint]

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            endpoints: dict[str, Any] = {}
            total_requests = 0
            total_errors = 0

            for key, item in self._data.items():
                requests = int(item["requests"])
                errors = int(item["errors"])
                lats = list(item["latency_ms"])
                total_requests += requests
                total_errors += errors

                avg = round(sum(lats) / len(lats), 2) if lats else 0.0
                endpoints[key] = {
                    "requests": requests,
                    "errors": errors,
                    "error_rate": round(errors / requests, 4) if requests else 0.0,
                    "latency_ms": {
                        "avg": avg,
                        "max": round(max(lats), 2) if lats else 0.0,
                        "p50": _percentile(lats, 0.50),
                        "p95": _percentile(lats, 0.95),
                        "p99": _percentile(lats, 0.99),
                    },
                }

            return {
                "totals": {
                    "requests": total_requests,
                    "errors": total_errors,
                    "error_rate": round(total_errors / total_requests, 4) if total_requests else 0.0,
                },
                "endpoints": endpoints,
                "max_samples_per_endpoint": self.max_samples_per_endpoint,
            }

    def reset(self) -> None:
        with self._lock:
            self._data.clear()
