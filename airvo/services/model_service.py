from __future__ import annotations

from typing import Any, Dict, List, Optional

from airvo.config.settings import settings
from airvo.core.contracts import ModelRecord


class ModelService:
    """Service layer for model CRUD and selection logic.

    This keeps API routes thin and gives us a stable boundary for future
    refactors without changing existing runtime behavior.
    """

    def list_models(self) -> List[Dict[str, Any]]:
        return settings.get_models()

    def list_active_models(self) -> List[Dict[str, Any]]:
        return settings.get_active_models()

    def add_model(self, model: Dict[str, Any]) -> Dict[str, Any]:
        settings.add_model(model)
        return {"ok": True, "model": model.get("id")}

    def update_model(self, model_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        settings.update_model(model_id, updates)
        return {"ok": True}

    def delete_model(self, model_id: str) -> Dict[str, Any]:
        settings.delete_model(model_id)
        return {"ok": True}

    def toggle_model(self, model_id: str, active: bool) -> Dict[str, Any]:
        settings.toggle_model(model_id, active)
        return {"ok": True, "active": active}

    def set_api_key(self, model_id: str, api_key: str) -> Dict[str, Any]:
        settings.set_api_key(model_id, api_key)
        return {"ok": True}

    def get_model_record(self, model_id: str) -> Optional[ModelRecord]:
        raw = settings.get_model_by_id(model_id)
        if raw is None:
            return None
        return ModelRecord.from_mapping(raw)
