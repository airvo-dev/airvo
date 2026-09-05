from __future__ import annotations

from typing import Any

from fastapi import Request


def get_request_id(request: Request) -> str:
    request_id = getattr(request.state, "request_id", "")
    return request_id if isinstance(request_id, str) else ""


def _error_message(detail: Any) -> str:
    if isinstance(detail, dict):
        msg = detail.get("message")
        if isinstance(msg, str) and msg.strip():
            return msg
        return "Request failed"
    if isinstance(detail, str) and detail.strip():
        return detail
    return "Request failed"


def _error_code(status_code: int) -> str:
    if status_code == 400:
        return "BAD_REQUEST"
    if status_code == 401:
        return "UNAUTHORIZED"
    if status_code == 402:
        return "PAYMENT_REQUIRED"
    if status_code == 403:
        return "FORBIDDEN"
    if status_code == 404:
        return "NOT_FOUND"
    if status_code == 413:
        return "PAYLOAD_TOO_LARGE"
    if status_code == 422:
        return "VALIDATION_ERROR"
    if status_code == 429:
        return "RATE_LIMITED"
    if status_code >= 500:
        return "INTERNAL_ERROR"
    return f"HTTP_{status_code}"


def build_http_error_payload(
    *,
    status_code: int,
    detail: Any,
    request_id: str,
    code: str | None = None,
) -> dict[str, Any]:
    message = _error_message(detail)
    return {
        "detail": message,
        "error": {
            "code": code or _error_code(status_code),
            "message": message,
            "status": status_code,
            "details": detail,
        },
        "request_id": request_id,
    }


def sse_error_event(
    *,
    message: str,
    request_id: str,
    code: str = "SSE_ERROR",
    **fields: Any,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "type": "error",
        "error": message,
        "error_meta": {
            "code": code,
            "message": message,
        },
        "request_id": request_id,
    }
    payload.update(fields)
    return payload
