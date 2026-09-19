"""Money value object — validated immutable primitive wrapper."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Money:
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Money must not be empty")
