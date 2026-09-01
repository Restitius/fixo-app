"""ResultMapper — converts raw driver results into domain-friendly shapes."""
from __future__ import annotations

import uuid
from collections.abc import Mapping, Sequence
from decimal import Decimal
from datetime import date, datetime
from typing import Any


class ResultMapper:
    """Normalizes driver rows into plain dicts with JSON-safe primitives."""

    def to_dicts(self, rows: Sequence[Any]) -> list[dict[str, Any]]:
        """Map a sequence of rows (mappings preferred) to list of dicts."""
        mapped: list[dict[str, Any]] = []
        for row in rows:
            if isinstance(row, Mapping):
                mapped.append(self.sanitize(dict(row)))
            elif hasattr(row, "_mapping"):  # SQLAlchemy Row
                mapped.append(self.sanitize(dict(row._mapping)))
            else:
                raise TypeError(
                    f"Cannot map row of type {type(row).__name__}; "
                    "provide cursor descriptions or use driver-specific mapping"
                )
        return mapped

    def sanitize(self, value: Any) -> Any:
        """Recursively convert dates/datetimes/decimals/UUIDs to JSON-safe values."""
        if isinstance(value, Mapping):
            return {k: self.sanitize(v) for k, v in value.items()}
        if isinstance(value, (list, tuple)):
            return [self.sanitize(v) for v in value]
        if isinstance(value, Decimal):
            return float(value)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, date):
            return value.isoformat()
        if isinstance(value, uuid.UUID):
            return str(value)
        if isinstance(value, (bytes, bytearray)):
            return value.decode(errors="replace")
        return value
