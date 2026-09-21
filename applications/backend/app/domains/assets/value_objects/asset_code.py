"""AssetCode value object — human-readable unique code (AST-XXXXXX)."""
from __future__ import annotations

import re
from dataclasses import dataclass

_PATTERN = re.compile(r"^AST-[A-Z0-9]{6}$")


@dataclass(frozen=True)
class AssetCode:
    value: str

    def __post_init__(self) -> None:
        if not _PATTERN.match(self.value or ""):
            raise ValueError(f"Invalid asset code: {self.value!r} (expected AST-XXXXXX)")
