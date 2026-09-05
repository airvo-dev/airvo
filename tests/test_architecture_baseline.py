import json
import re

from fastapi.testclient import TestClient
import airvo.server as server_module

from airvo.core import ModelRecord
from airvo.infra import load_models
from airvo.repositories.config_repository import ConfigRepository
from airvo.services.config_service import ConfigService
from airvo.services.free_route_service import FreeRouteService
from airvo.services.model_selection_service import ModelSelectionService
from airvo.services.model_service import ModelService
from airvo.services.router_service import RouterService
from airvo.server import MAX_REQUEST_SIZE, app


client = TestClient(app)


def test_architecture_contract_imports():
    model = ModelRecord.from_mapping({
        "id": "demo/test-model",
        "name": "Test Model",
        "provider": "demo",
        "active": True,
    })

    assert model.id == "demo/test-model"
    assert model.provider == "demo"
    assert model.to_mapping()["active"] is True


def test_infra_accessors_are_available():
    models = load_models()

    assert isinstance(models, list)
    assert len(models) >= 1
    assert "id" in models[0]


def test_free_route_service_status_shape(monkeypatch):
    def fake_get_status():
        return {"enabled": False}

    monkeypatch.setattr("airvo.services.free_route_service.get_status", fake_get_status)

    status = FreeRouteService().status()
    assert status == {"enabled": False}


def test_router_service_classifies_prompt():
    category = RouterService().classify("Fix this Python TypeError in my app")
    assert category == "debug"

    categories = RouterService().categories()
    assert "code" in categories
    assert "general" in categories


def test_model_service_list_models():
    models = ModelService().list_models()
    assert isinstance(models, list)
    assert len(models) >= 1


def test_config_service_loads_persisted_repository_data():
    service = ConfigService(repository=ConfigRepository())
    models = service.get_models()
    prefs = service.get_prefs()

    assert isinstance(models, list)
    assert isinstance(prefs, dict)
    assert "mode" in prefs


def test_model_selection_service_selects_active_model():
    service = ModelSelectionService()
    selected = service.select_primary_model()

    assert selected in {m["id"] for m in load_models() if m.get("active")}


def test_http_validation_error_has_standard_envelope_and_request_id_header():
    response = client.post("/api/compare/stream", json={})

    assert response.status_code == 422
    payload = response.json()
    assert "request_id" in payload
    assert "error" in payload
    assert "detail" in payload
    assert payload["error"]["status"] == 422
    assert response.headers.get("x-request-id")


def test_http_error_from_endpoint_uses_standard_envelope(monkeypatch):
    class _SettingsStub:
        @staticmethod
        def get_active_models():
            return []

        @staticmethod
        def get_prefs():
            return {}

    monkeypatch.setattr("airvo.api.endpoints.compare.settings", _SettingsStub())

    response = client.post("/api/compare/stream", json={"prompt": "hola"})

    assert response.status_code == 400
    payload = response.json()
    assert payload["error"]["code"] == "BAD_REQUEST"
    assert payload["error"]["status"] == 400
    assert payload["request_id"]
    assert response.headers.get("x-request-id")


def test_middleware_payload_too_large_uses_standard_envelope():
    body = "x" * (MAX_REQUEST_SIZE + 1)
    response = client.post("/api/chat/stream", data=body, headers={"Content-Type": "application/json"})

    assert response.status_code == 413
    payload = response.json()
    assert payload["error"]["code"] == "PAYLOAD_TOO_LARGE"
    assert payload["error"]["status"] == 413
    assert payload["request_id"]
    assert response.headers.get("x-request-id")


def test_sse_error_event_includes_request_id_and_error_meta(monkeypatch):
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

    match = re.search(r"data:\s*(\{.*\})", response.text)
    assert match is not None
    payload = json.loads(match.group(1))
    assert payload["type"] == "error"
    assert payload["error"] == "No active model configured"
    assert payload["request_id"]
    assert payload["error_meta"]["code"] == "NO_ACTIVE_MODEL"


def test_compare_stream_rejected_emits_structured_log(monkeypatch, caplog):
    class _SettingsStub:
        @staticmethod
        def get_active_models():
            return []

    monkeypatch.setattr("airvo.api.endpoints.compare.settings", _SettingsStub())
    caplog.set_level("INFO", logger="airvo.api.endpoints.compare")

    response = client.post("/api/compare/stream", json={"prompt": "hola"})

    assert response.status_code == 400
    assert any('"event": "compare_stream_rejected"' in rec.getMessage() for rec in caplog.records)


def test_chat_history_no_model_emits_structured_log(monkeypatch, caplog):
    class _SettingsStub:
        @staticmethod
        def get_prefs():
            return {}

        @staticmethod
        def get_active_models():
            return []

    monkeypatch.setattr("airvo.api.endpoints.chat_history.settings", _SettingsStub())
    caplog.set_level("INFO", logger="airvo.api.endpoints.chat_history")

    response = client.post("/api/chat/stream", json={"message": "hola"})

    assert response.status_code == 200
    assert any('"event": "chat_history_stream_rejected"' in rec.getMessage() for rec in caplog.records)


def test_chat_completions_no_active_models_emits_structured_log(monkeypatch, caplog):
    class _SettingsStub:
        system_prompt = "stub"
        max_tokens = 1024
        temperature = 0.7

        @staticmethod
        def get_active_models():
            return []

        @staticmethod
        def get_memory_prompt():
            return None

        @staticmethod
        def get_prefs():
            return {}

    monkeypatch.setattr("airvo.api.endpoints.chat_completions.settings", _SettingsStub())
    caplog.set_level("INFO", logger="airvo.api.endpoints.chat_completions")

    response = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "hola"}], "stream": True},
    )

    assert response.status_code == 400
    assert any('"event": "chat_completion_rejected"' in rec.getMessage() for rec in caplog.records)


def test_rate_limit_returns_429_with_standard_envelope(monkeypatch):
    server_module._rate_limiter.reset()
    monkeypatch.setattr(server_module, "RATE_LIMIT_WINDOW_SECONDS", 60)
    monkeypatch.setattr(server_module, "RATE_LIMIT_DEFAULT_PER_WINDOW", 1)
    monkeypatch.setattr(server_module, "RATE_LIMIT_STREAM_PER_WINDOW", 1)

    headers = {"x-forwarded-for": "10.10.10.10"}

    first = client.get("/api/health", headers=headers)
    second = client.get("/api/health", headers=headers)

    assert first.status_code == 200
    assert second.status_code == 429
    payload = second.json()
    assert payload["error"]["code"] == "RATE_LIMITED"
    assert payload["error"]["status"] == 429
    assert payload["request_id"]
    assert second.headers.get("retry-after")
    assert second.headers.get("x-request-id")


def test_admin_token_protects_sensitive_mutations_when_enabled(monkeypatch):
    server_module._rate_limiter.reset()
    monkeypatch.setattr(server_module, "ADMIN_TOKEN", "topsecret")

    response = client.patch("/api/prefs", json={"temperature": 0.4})

    assert response.status_code == 401
    payload = response.json()
    assert payload["error"]["code"] == "UNAUTHORIZED"
    assert payload["request_id"]
    assert response.headers.get("www-authenticate") == "Bearer"


def test_admin_token_allows_sensitive_mutations_with_valid_token(monkeypatch):
    server_module._rate_limiter.reset()
    monkeypatch.setattr(server_module, "ADMIN_TOKEN", "topsecret")

    response = client.patch(
        "/api/prefs",
        json={"temperature": 0.5},
        headers={"Authorization": "Bearer topsecret"},
    )

    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_rate_limit_is_scoped_per_path(monkeypatch):
    server_module._rate_limiter.reset()
    monkeypatch.setattr(server_module, "RATE_LIMIT_WINDOW_SECONDS", 60)
    monkeypatch.setattr(server_module, "RATE_LIMIT_DEFAULT_PER_WINDOW", 1)
    monkeypatch.setattr(server_module, "RATE_LIMIT_STREAM_PER_WINDOW", 1)

    headers = {"x-forwarded-for": "10.10.10.11"}

    r1 = client.get("/api/health", headers=headers)
    r2 = client.get("/v1/models", headers=headers)

    assert r1.status_code == 200
    assert r2.status_code == 200


def test_ops_metrics_expose_percentiles_and_error_counts():
    reset = client.delete("/api/stats/ops")
    assert reset.status_code == 200

    h1 = client.get("/api/health")
    h2 = client.get("/api/health")
    bad = client.post("/api/compare/stream", json={})
    snap = client.get("/api/stats/ops")

    assert h1.status_code == 200
    assert h2.status_code == 200
    assert bad.status_code == 422
    assert snap.status_code == 200

    payload = snap.json()["ops"]
    assert payload["totals"]["requests"] >= 3
    assert payload["totals"]["errors"] >= 1

    health_key = "GET /api/health"
    compare_key = "POST /api/compare/stream"
    assert health_key in payload["endpoints"]
    assert compare_key in payload["endpoints"]
    assert payload["endpoints"][compare_key]["errors"] >= 1

    lat = payload["endpoints"][health_key]["latency_ms"]
    assert "p50" in lat
    assert "p95" in lat
    assert "p99" in lat


def test_ops_metrics_reset_clears_collector():
    _ = client.get("/api/health")
    reset = client.delete("/api/stats/ops")
    snap = client.get("/api/stats/ops")

    assert reset.status_code == 200
    assert snap.status_code == 200
    payload = snap.json()["ops"]
    assert payload["totals"]["requests"] <= 1


def test_ops_alerts_endpoint_returns_shape(monkeypatch):
    class _SettingsStub:
        @staticmethod
        def get_prefs():
            return {
                "slo_error_rate_warn": 0.05,
                "slo_p95_ms_warn": 1200,
                "slo_p99_ms_warn": 2500,
            }

    monkeypatch.setattr("airvo.api.endpoints.stats.settings", _SettingsStub())

    response = client.get("/api/stats/ops/alerts")
    assert response.status_code == 200
    payload = response.json()["slo"]
    assert "ok" in payload
    assert "thresholds" in payload
    assert "alerts" in payload


def test_ops_alerts_detect_error_rate_warning(monkeypatch):
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

    headers = {"x-forwarded-for": "10.10.10.22"}
    _ = client.post("/api/compare/stream", json={}, headers=headers)
    response = client.get("/api/stats/ops/alerts", headers=headers)

    assert response.status_code == 200
    payload = response.json()["slo"]
    assert payload["ok"] is False
    assert any(a["kind"] == "error_rate" for a in payload["alerts"])
