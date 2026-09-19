"""Paginated response helper — Page objects rendered into the envelope."""
from __future__ import annotations

from typing import Any

from fastapi.responses import JSONResponse

from app.shared.pagination.paginator import Page
from app.shared.responses.envelope import success_envelope


def paginated(
    page: Page,
    *,
    title: str = "Success",
    body: str = "",
    extra_meta: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> JSONResponse:
    """Render a Page with pagination metadata under meta.pagination."""
    meta: dict[str, Any] = {
        "pagination": {
            "page": page.page,
            "size": page.size,
            "total": page.total,
            "pages": page.pages,
            "has_next": page.has_next,
            "has_previous": page.has_previous,
        }
    }
    if extra_meta:
        meta.update(extra_meta)
    return JSONResponse(
        status_code=200,
        content=success_envelope(data=page.items, title=title, body=body, meta=meta, request_id=request_id),
    )
