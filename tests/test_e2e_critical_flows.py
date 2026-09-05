import json
import re

from fastapi.testclient import TestClient
import airvo.server as server_module
from airvo.server import app


client = TestClient(app)


def test_e2e_admin_token_flow_for_sensitive_endpoints(monkeypatch):
    server_module._rate_limiter.reset()
    monkeypatch.setattr(server_module, "ADMIN_TOKEN", "phase6-token")

    blocked = client.patch("/api/prefs", json={"temperature": 0.31})
    assert blocked.status_code == 401
    assert blocked.json()["error"]["code"] == "UNAUTHORIZED"

    allowed = client.patch(
        "/api/prefs",
        json={"temperature": 0.31},
        headers={"X-Airvo-Token": "phase6-token"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["ok"] is True


def test_e2e_stream_contract_and_request_id_header(monkeypatch):
    class _SettingsStub:
        @staticmethod
        def get_prefs():
            return {}

        @staticmethod
        def get_active_models():
            return []

    monkeypatch.setattr("airvo.api.endpoints.chat_history.settings", _SettingsStub())

    response = client.post("/api/chat/stream", json={"message": "hola"})

    assert response.status_code == 200
    assert response.headers.get("x-request-id")

    match = re.search(r"data:\s*(\{.*\})", response.text)
    assert match is not None
    payload = json.loads(match.group(1))
    assert payload["type"] == "error"
    assert payload["error_meta"]["code"] == "NO_ACTIVE_MODEL"
    assert payload["request_id"]


def test_e2e_ops_metrics_and_alerts_shape(monkeypatch):
    server_module._rate_limiter.reset()
    server_module._ops_metrics.reset()

    class _SettingsStub:
        @staticmethod
        def get_prefs():
            return {
                "slo_error_rate_warn": 0.01,
                "slo_p95_ms_warn": 999999,
                "slo_p99_ms_warn": 999999,
            }

    monkeypatch.setattr("airvo.api.endpoints.stats.settings", _SettingsStub())

    _ = client.get("/api/health")
    _ = client.post("/api/compare/stream", json={})

    ops = client.get("/api/stats/ops")
    assert ops.status_code == 200
    ops_payload = ops.json()["ops"]
    assert ops_payload["totals"]["requests"] >= 2
    assert "GET /api/health" in ops_payload["endpoints"]

    alerts = client.get("/api/stats/ops/alerts")
    assert alerts.status_code == 200
    slo = alerts.json()["slo"]
    assert "ok" in slo
    assert "alerts" in slo
    assert any(a["kind"] == "error_rate" for a in slo["alerts"])


def test_e2e_metrics_endpoint_exposes_or_guides():
    response = client.get("/metrics")
    assert response.status_code in (200, 503)

    if response.status_code == 503:
        payload = response.json()
        assert payload["ok"] is False
        assert "Prometheus" in payload["detail"]
