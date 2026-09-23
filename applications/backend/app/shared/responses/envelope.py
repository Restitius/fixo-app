"""Standard response envelope construction (pure functions).

Canonical shape (architecture §25)::

    {
      "success": true,
      "message": {"type": "success", "title": "...", "body": "..."},
      "data":    {},
      "meta":    {},
      "request_id": "req-..."
    }

Errors add an 'error' block: {"code": "...", "details": {...}}.
"""
from __future__ import annotations

from typing import Any


def build_message(
    message_type: str,
    title: str,
    body: str,
    *,
    message_id: str | None = None,
    presentation: str = "toast",
    params: dict[str, Any] | None = None,
    action: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Build the nested message block."""
    return {
        "id": message_id,
        "type": message_type,
        "presentation": presentation,
        "title": title,
        "body": body,
        "params": params or {},
        "action": action,
    }


def build_envelope(
    *,
    success: bool = True,
    message: dict[str, Any] | None = None,
    data: Any = None,
    meta: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> dict[str, Any]:
    """Build the standard envelope with defaults applied."""
    return {
        "success": success,
        "message": message or build_message(
            "success" if success else "error",
            "OK" if success else "Error",
            "" if success else "Request could not be completed.",
        ),
        "data": data if data is not None else {},
        "meta": meta or {},
        "request_id": request_id,
    }


def success_envelope(
    data: Any = None,
    *,
    title: str = "Success",
    body: str = "",
    meta: dict[str, Any] | None = None,
    request_id: str | None = None,
    message: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return build_envelope(
        success=True,
        message=message or build_message("success", title, body),
        data=data,
        meta=meta,
        request_id=request_id,
    )


def error_envelope(
    *,
    code: str,
    title: str = "Error",
    body: str = "",
    details: dict[str, Any] | None = None,
    request_id: str | None = None,
    message: dict[str, Any] | None = None,
) -> dict[str, Any]:
    envelope = build_envelope(
        success=False,
        message=message or build_message("error", title, body),
        data=None,
        meta=None,
        request_id=request_id,
    )
    envelope["error"] = {"code": code, "details": details or {}}
    return envelope
