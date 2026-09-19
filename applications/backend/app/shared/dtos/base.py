"""Base DTO — the internal transport object between layers.

Rule (§24): Request schemas validate HTTP input; DTOs move data INSIDE the
application; services accept DTOs, never FastAPI/Pydantic request objects.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, fields
from typing import Any


@dataclass
class BaseDTO:
    """Common behaviour for all DTOs."""

    def to_dict(self, *, drop_none: bool = True) -> dict[str, Any]:
        """Serialize to a plain dict, optionally pruning None values."""
        payload = asdict(self)
        if not drop_none:
            return payload
        return {k: v for k, v in payload.items() if v is not None}

    @classmethod
    def field_names(cls) -> list[str]:
        return [f.name for f in fields(cls)]
