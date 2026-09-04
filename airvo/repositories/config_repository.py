from __future__ import annotations

import json
import os
from typing import Any, Dict, List


class ConfigRepository:
    """Repository for Airvo persistence in ~/.airvo.

    This separates file I/O from business logic and creates a cleaner boundary
    for future storage backends or migrations.
    """

    def __init__(self):
        self.root = os.path.join(os.path.expanduser("~"), ".airvo")

    def ensure_dir(self) -> None:
        os.makedirs(self.root, exist_ok=True)

    def load_json(self, filename: str, default: Any = None) -> Any:
        path = os.path.join(self.root, filename)
        if not os.path.exists(path):
            return default
        try:
            with open(path, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except (json.JSONDecodeError, OSError):
            return default

    def save_json(self, filename: str, value: Any) -> None:
        self.ensure_dir()
        path = os.path.join(self.root, filename)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(value, fh, indent=2, ensure_ascii=False)

    def load_models(self) -> List[Dict[str, Any]]:
        data = self.load_json("models.json", [])
        return data if isinstance(data, list) else []

    def save_models(self, models: List[Dict[str, Any]]) -> None:
        self.save_json("models.json", models)

    def load_prefs(self) -> Dict[str, Any]:
        data = self.load_json("prefs.json", {})
        return data if isinstance(data, dict) else {}

    def save_prefs(self, prefs: Dict[str, Any]) -> None:
        self.save_json("prefs.json", prefs)

    def load_stats(self) -> Dict[str, Any]:
        data = self.load_json("stats.json", {})
        return data if isinstance(data, dict) else {}

    def save_stats(self, stats: Dict[str, Any]) -> None:
        self.save_json("stats.json", stats)
