#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import statistics
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    idx = int(round((len(ordered) - 1) * p))
    idx = max(0, min(idx, len(ordered) - 1))
    return round(ordered[idx], 2)


def make_request(base_url: str, path: str, timeout_s: float, headers: dict[str, str]) -> tuple[int, float]:
    t0 = time.perf_counter()
    req = urllib.request.Request(url=f"{base_url}{path}", method="GET", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            status = int(resp.status)
            _ = resp.read(16)
    except urllib.error.HTTPError as exc:
        status = int(exc.code)
    except Exception:
        status = 0
    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return status, round(elapsed_ms, 2)


def run_scenario(
    *,
    base_url: str,
    path: str,
    concurrency: int,
    requests_per_worker: int,
    timeout_s: float,
    headers: dict[str, str],
) -> dict:
    statuses: list[int] = []
    latencies: list[float] = []
    lock = threading.Lock()

    def worker() -> None:
        local_statuses = []
        local_latencies = []
        for _ in range(requests_per_worker):
            st, ms = make_request(base_url, path, timeout_s, headers)
            local_statuses.append(st)
            local_latencies.append(ms)
        with lock:
            statuses.extend(local_statuses)
            latencies.extend(local_latencies)

    t0 = time.perf_counter()
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(worker) for _ in range(concurrency)]
        for f in futures:
            f.result()
    total_s = max(0.0001, time.perf_counter() - t0)

    total_requests = len(statuses)
    ok_requests = sum(1 for s in statuses if 200 <= s < 400)
    error_requests = total_requests - ok_requests
    error_rate = (error_requests / total_requests) if total_requests else 1.0

    metrics = {
        "requests": total_requests,
        "ok": ok_requests,
        "errors": error_requests,
        "error_rate": round(error_rate, 4),
        "rps": round(total_requests / total_s, 2),
        "latency_ms": {
            "avg": round(statistics.fmean(latencies), 2) if latencies else 0.0,
            "p50": percentile(latencies, 0.50),
            "p95": percentile(latencies, 0.95),
            "p99": percentile(latencies, 0.99),
            "max": round(max(latencies), 2) if latencies else 0.0,
        },
        "status_codes": {str(code): statuses.count(code) for code in sorted(set(statuses))},
        "duration_s": round(total_s, 3),
    }
    return metrics


def main() -> int:
    parser = argparse.ArgumentParser(description="Reproducible load benchmark for Airvo endpoints")
    parser.add_argument("--base-url", default="http://127.0.0.1:8765", help="Airvo base URL")
    parser.add_argument("--path", default="/api/health", help="Endpoint path to benchmark")
    parser.add_argument("--concurrency", type=int, default=10, help="Worker threads")
    parser.add_argument("--requests-per-worker", type=int, default=50, help="Requests per worker")
    parser.add_argument("--timeout", type=float, default=5.0, help="Per-request timeout in seconds")
    parser.add_argument("--max-p95-ms", type=float, default=500.0, help="Fail if p95 exceeds this")
    parser.add_argument("--max-error-rate", type=float, default=0.02, help="Fail if error rate exceeds this")
    parser.add_argument("--header", action="append", default=[], help="Extra header key:value")
    parser.add_argument("--output", default="", help="Optional report output path")

    args = parser.parse_args()

    headers: dict[str, str] = {}
    for item in args.header:
        if ":" not in item:
            continue
        k, v = item.split(":", 1)
        headers[k.strip()] = v.strip()

    result = run_scenario(
        base_url=args.base_url.rstrip("/"),
        path=args.path,
        concurrency=max(1, int(args.concurrency)),
        requests_per_worker=max(1, int(args.requests_per_worker)),
        timeout_s=max(0.1, float(args.timeout)),
        headers=headers,
    )

    gates = {
        "max_p95_ms": args.max_p95_ms,
        "max_error_rate": args.max_error_rate,
    }
    passed = (
        result["latency_ms"]["p95"] <= gates["max_p95_ms"]
        and result["error_rate"] <= gates["max_error_rate"]
    )

    report = {
        "scenario": {
            "base_url": args.base_url,
            "path": args.path,
            "concurrency": args.concurrency,
            "requests_per_worker": args.requests_per_worker,
            "timeout_s": args.timeout,
        },
        "gates": gates,
        "result": result,
        "passed": passed,
        "timestamp_epoch": int(time.time()),
    }

    text = json.dumps(report, indent=2)
    print(text)
    if args.output:
        Path(args.output).write_text(text + "\n", encoding="utf-8")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
