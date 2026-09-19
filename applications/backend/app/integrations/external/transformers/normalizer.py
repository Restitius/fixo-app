"""Payload transformers (pure) — key casing, pruning, date shaping."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any


def drop_none_values(payload: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in payload.items() if v is not None}


def iso_dates(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        k: v.isoformat() if isinstance(v, (datetime, date)) else v
        for k, v in payload.items()
    }


def to_camel_keys(payload: dict[str, Any]) -> dict[str, Any]:
    def camel(name: str) -> str:
        parts = name.split("_")
        return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])
    return {camel(k): v for k, v in payload.items()}


def to_snake_keys(payload: dict[str, Any]) -> dict[str, Any]:
    def snake(name: str) -> str:
        out = []
        for ch in name:
            if ch.isupper():
                out.append("_")
                out.append(ch.lower())
            else:
                out.append(ch)
        return "".join(out).lstrip("_")
    return {snake(k): v for k, v in payload.items()}
