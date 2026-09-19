"""SecretResolver — typed access to environment-held secrets."""
from __future__ import annotations

import os
from collections.abc import Mapping

from app.shared.exceptions.hierarchy import ConfigurationError


class SecretResolver:
    """Reads secrets from the process environment (never hard-code them)."""

    def __init__(self, environ: Mapping[str, str] | None = None) -> None:
        self._environ = environ if environ is not None else os.environ

    def get(self, key: str, *, required: bool = True, default: str = "") -> str:
        value = self._environ.get(key, "")
        if not value:
            if required:
                raise ConfigurationError(
                    f"Missing required secret/env: {key}",
                    code="CONFIG.SECRET_MISSING",
                )
            return default
        return value

    def optional(self, key: str, default: str = "") -> str:
        return self.get(key, required=False, default=default)
