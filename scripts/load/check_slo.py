#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import urllib.request
from pathlib import Path

from airvo.observability import evaluate_slo


def fetch_ops_snapshot(base_url: str, timeout_s: float) -> dict:
    req = urllib.request.Request(url=f"{base_url.rstrip('/')}/api/stats/ops", method="GET")
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    ops = payload.get("ops")
    if not isinstance(ops, dict):
        raise ValueError("Invalid /api/stats/ops payload")
    return ops


def main() -> int:
    parser = argparse.ArgumentParser(description="Check Airvo ops metrics against official SLO targets")
    parser.add_argument("--base-url", default="http://127.0.0.1:8765", help="Airvo base URL")
    parser.add_argument("--slo-file", default="ops/slo/official_slo.json", help="Path to official SLO JSON")
    parser.add_argument("--timeout", type=float, default=5.0, help="HTTP timeout seconds")
    parser.add_argument("--output", default="", help="Optional report output path")
    args = parser.parse_args()

    slo_cfg = json.loads(Path(args.slo_file).read_text(encoding="utf-8"))
    ops = fetch_ops_snapshot(args.base_url, args.timeout)
    failures = evaluate_slo(ops, slo_cfg)

    report = {
        "ok": len(failures) == 0,
        "base_url": args.base_url,
        "slo_file": args.slo_file,
        "failures": failures,
        "totals": ops.get("totals", {}),
    }

    text = json.dumps(report, indent=2)
    print(text)

    if args.output:
        Path(args.output).write_text(text + "\n", encoding="utf-8")

    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
