from __future__ import annotations

from typing import List

from airvo.config.settings import settings


class ModelSelectionService:
    """Selects the primary model while keeping selection logic out of the API layer."""

    def select_primary_model(self) -> str:
        active = settings.get_active_models()
        if not active:
            return ""
        return active[0]["id"]

    def select_active_models(self) -> List[str]:
        return [m["id"] for m in settings.get_active_models()]
