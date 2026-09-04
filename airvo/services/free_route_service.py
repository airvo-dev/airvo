from __future__ import annotations

from airvo.free_route.manager import get_status, setup, refresh, disable, test_api_key


class FreeRouteService:
    """Thin application service that isolates HTTP/API concerns from Free Route logic."""

    def status(self) -> dict:
        return get_status()

    def setup(self, api_key: str, mode: str = "add") -> dict:
        return setup(api_key)

    def refresh(self) -> dict:
        return refresh()

    def disable(self) -> dict:
        disable()
        return {"ok": True}

    def test_key(self, api_key: str) -> bool:
        return test_api_key(api_key)
