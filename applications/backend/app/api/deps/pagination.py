"""Pagination dependency — normalized page/size from query string."""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Query

from app.shared.pagination.paginator import Paginator


@dataclass(frozen=True)
class PaginationParams:
    page: int
    size: int

    @property
    def offset(self) -> int:
        return Paginator.offset(self.page, self.size)


def get_pagination(
    page: int = Query(1, ge=1, description="1-based page number"),
    size: int = Query(Paginator.DEFAULT_SIZE, ge=1, le=Paginator.MAX_SIZE),
) -> PaginationParams:
    """Normalize and expose pagination parameters (pure)."""
    normalized_page, normalized_size = Paginator.normalize(page, size)
    return PaginationParams(page=normalized_page, size=normalized_size)


PaginationDep = PaginationParams
