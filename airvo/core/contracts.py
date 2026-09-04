from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass(slots=True)
class ModelRecord:
    """Minimal domain contract for a model definition.

    This is intentionally small and non-invasive: it gives us a clear boundary
    for future refactors without changing the current runtime behavior.
    """

    id: str
    name: str
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    active: bool = True
    free: bool = False
    notes: str = ""
    free_route: bool = False
    extra: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_mapping(cls, data: Dict[str, Any]) -> "ModelRecord":
        extras = {k: v for k, v in data.items() if k not in {
            "id", "name", "provider", "api_key", "base_url",
            "active", "free", "notes", "free_route"
        }}
        return cls(
            id=data.get("id", ""),
            name=data.get("name", data.get("id", "")),
            provider=data.get("provider", ""),
            api_key=data.get("api_key"),
            base_url=data.get("base_url"),
            active=bool(data.get("active", True)),
            free=bool(data.get("free", False)),
            notes=str(data.get("notes", "")),
            free_route=bool(data.get("free_route", False)),
            extra=extras,
        )

    def to_mapping(self) -> Dict[str, Any]:
        data = {
            "id": self.id,
            "name": self.name,
            "provider": self.provider,
            "api_key": self.api_key,
            "base_url": self.base_url,
            "active": self.active,
            "free": self.free,
            "notes": self.notes,
            "free_route": self.free_route,
        }
        data.update(self.extra)
        return data
