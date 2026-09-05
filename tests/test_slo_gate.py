from airvo.observability import evaluate_slo


def test_evaluate_slo_passes_when_within_thresholds():
    ops = {
        "endpoints": {
            "GET /api/health": {
                "requests": 30,
                "error_rate": 0.0,
                "latency_ms": {"p95": 120.0, "p99": 200.0},
            }
        }
    }
    slo_cfg = {
        "global": {"min_requests": 20},
        "endpoints": {
            "GET /api/health": {
                "max_error_rate": 0.01,
                "max_p95_ms": 300,
                "max_p99_ms": 600,
            }
        },
    }

    failures = evaluate_slo(ops, slo_cfg)
    assert failures == []


def test_evaluate_slo_reports_failures():
    ops = {
        "endpoints": {
            "GET /api/health": {
                "requests": 25,
                "error_rate": 0.03,
                "latency_ms": {"p95": 450.0, "p99": 900.0},
            }
        }
    }
    slo_cfg = {
        "global": {"min_requests": 20},
        "endpoints": {
            "GET /api/health": {
                "max_error_rate": 0.01,
                "max_p95_ms": 300,
                "max_p99_ms": 600,
            }
        },
    }

    failures = evaluate_slo(ops, slo_cfg)
    reasons = {f["reason"] for f in failures}
    assert "error_rate_exceeded" in reasons
    assert "p95_exceeded" in reasons
    assert "p99_exceeded" in reasons


def test_evaluate_slo_requires_min_samples():
    ops = {
        "endpoints": {
            "GET /api/health": {
                "requests": 3,
                "error_rate": 0.0,
                "latency_ms": {"p95": 50.0, "p99": 60.0},
            }
        }
    }
    slo_cfg = {
        "global": {"min_requests": 20},
        "endpoints": {
            "GET /api/health": {
                "max_error_rate": 0.01,
                "max_p95_ms": 300,
                "max_p99_ms": 600,
            }
        },
    }

    failures = evaluate_slo(ops, slo_cfg)
    assert len(failures) == 1
    assert failures[0]["reason"] == "insufficient_samples"
