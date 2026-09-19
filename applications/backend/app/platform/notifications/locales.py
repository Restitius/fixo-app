"""Locale resource loader for the notification catalogue.

Resources live at app/platform/notifications/locales/<lang>.json, one file
per language, keyed by NOTIFICATION_KEY -> recipient_type -> {title, body}.
Files are loaded once per process (module-level cache) and always fall back
to 'en' when a specific locale is missing a key.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_LOCALES_DIR = Path(__file__).resolve().parent / "locales"
_cache: dict[str, dict[str, Any]] = {}


def _load(locale: str) -> dict[str, Any]:
    if locale not in _cache:
        path = _LOCALES_DIR / f"{locale}.json"
        if path.exists():
            _cache[locale] = json.loads(path.read_text(encoding="utf-8"))
        else:
            _cache[locale] = {}
    return _cache[locale]


def render_locale_template(
    key: str, recipient_type: str, locale: str, payload: dict[str, Any]
) -> tuple[str, str] | None:
    """Render (title, body) for a catalogue key, falling back to English."""
    for candidate in (locale, "en"):
        entry = _load(candidate).get(key, {}).get(recipient_type)
        if entry:
            try:
                return entry["title"].format(**payload), entry["body"].format(**payload)
            except (KeyError, IndexError):
                return entry["title"], entry["body"]
    return None
