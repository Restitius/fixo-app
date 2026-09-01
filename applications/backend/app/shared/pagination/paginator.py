"""Pagination primitives shared across domains and API responses."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, Sequence, TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class Page(Generic[T]):
    """One page of results plus total counts."""

    items: list[T]
    total: int
    page: int
    size: int

    @property
    def pages(self) -> int:
        if self.size <= 0:
            return 1
        return max(1, -(-self.total // self.size))

    @property
    def has_next(self) -> bool:
        return self.page < self.pages

    @property
    def has_previous(self) -> bool:
        return self.page > 1


class Paginator:
    """Normalizes page/size pairs and slices sequences (pure)."""

    DEFAULT_SIZE = 20
    MAX_SIZE = 100

    @classmethod
    def normalize(cls, page: int, size: int) -> tuple[int, int]:
        page = max(1, int(page))
        size = min(max(1, int(size)), cls.MAX_SIZE)
        return page, size

    @classmethod
    def offset(cls, page: int, size: int) -> int:
        page, size = cls.normalize(page, size)
        return (page - 1) * size

    @classmethod
    def from_sequence(
        cls,
        items: Sequence[T],
        page: int = 1,
        size: int = DEFAULT_SIZE,
    ) -> Page[T]:
        """Slice an in-memory sequence into a Page (for tests/small sets)."""
        page, size = cls.normalize(page, size)
        start = (page - 1) * size
        return Page(
            items=list(items[start : start + size]),
            total=len(items),
            page=page,
            size=size,
        )
