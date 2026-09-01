"""Base API schema — camelCase aliases so HTTP JSON matches frontend conventions.

Import-safe without third-party deps installed: falls back to a plain marker
class until pydantic is available (dependencies install during bootstrap).
"""
from __future__ import annotations

def _to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])


try:  # pragma: no cover - depends on environment
    from pydantic import BaseModel, ConfigDict

    class BaseSchema(BaseModel):
        """BaseModel with camelCase alias generation and population by field name."""

        model_config = ConfigDict(
            alias_generator=_to_camel,
            populate_by_name=True,
            extra="forbid",
        )

except ImportError:  # pragma: no cover - scaffold fallback

    class BaseSchema:  # type: ignore[no-redef]
        """Placeholder until pydantic is installed (see requirements.txt)."""

        model_config: dict = {}
