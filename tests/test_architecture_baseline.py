from airvo.core import ModelRecord
from airvo.infra import load_models
from airvo.repositories.config_repository import ConfigRepository
from airvo.services.config_service import ConfigService
from airvo.services.free_route_service import FreeRouteService
from airvo.services.model_selection_service import ModelSelectionService
from airvo.services.model_service import ModelService
from airvo.services.router_service import RouterService


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
