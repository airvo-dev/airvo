from fastapi import APIRouter

from airvo.config.settings import settings
from airvo.privacy.detector import has_high_severity, scan, severity

router = APIRouter()


@router.post("/api/privacy/scan", tags=["Privacy"],
    summary="Scan text for sensitive secrets",
    description="Scans the provided text for API keys, passwords, tokens, emails, and other sensitive patterns. Returns matches with severity and redacted values.")
def privacy_scan(body: dict):
    text = body.get("text", "") if isinstance(body, dict) else ""
    matches = scan(text)
    return {
        "clean": len(matches) == 0,
        "force_local": has_high_severity(matches),
        "findings": [
            {
                "kind": m.kind,
                "severity": severity(m),
                "redacted": m.redacted,
                "start": m.start,
                "end": m.end,
            }
            for m in matches
        ],
    }


@router.get("/api/privacy/status", tags=["Privacy"], summary="Get Privacy Mode status")
def privacy_status():
    prefs = settings.get_prefs()
    return {"enabled": prefs.get("privacy_mode_enabled", False)}


@router.post("/api/privacy/status", tags=["Privacy"], summary="Enable or disable Privacy Mode")
def privacy_set_status(body: dict):
    enabled = bool(body.get("enabled", False))
    settings.update_prefs({"privacy_mode_enabled": enabled})
    return {"enabled": enabled}
