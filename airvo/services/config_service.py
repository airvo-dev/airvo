from __future__ import annotations

from typing import Any, Dict, List

from airvo.repositories.config_repository import ConfigRepository


class ConfigService:
    """Service for reading persisted config and preferences without exposing storage details."""

    def __init__(self, repository: ConfigRepository | None = None):
        self.repository = repository or ConfigRepository()

    def get_models(self) -> List[Dict[str, Any]]:
        return self.repository.load_models()

    def get_active_models(self) -> List[Dict[str, Any]]:
        return [m for m in self.get_models() if m.get("active")]

    def get_prefs(self) -> Dict[str, Any]:
        return self.repository.load_prefs()

    def update_prefs(self, values: Dict[str, Any]) -> Dict[str, Any]:
        prefs = self.get_prefs()
        prefs.update(values)
        self.repository.save_prefs(prefs)
        return {"ok": True}
