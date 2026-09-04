from fastapi.testclient import TestClient

from airvo.server import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "ok"
    assert "version" in payload
    assert isinstance(payload["active_models"], list)
    assert isinstance(payload["total_models"], int)


def test_models_endpoint():
    response = client.get("/api/models")
    assert response.status_code == 200

    payload = response.json()
    assert "models" in payload
    assert isinstance(payload["models"], list)
    assert len(payload["models"]) >= 1
    assert "id" in payload["models"][0]


def test_free_route_status_endpoint():
    response = client.get("/api/free-route/status")
    assert response.status_code == 200

    payload = response.json()
    assert "enabled" in payload
    assert isinstance(payload["enabled"], bool)
    if "models" in payload:
        assert isinstance(payload["models"], list)
